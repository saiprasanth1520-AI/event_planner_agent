import { Langbase, Workflow, Role, PromptMessage } from "langbase";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

async function evanaWorkflow({ input, env }) {
  const langbase = new Langbase({
    apiKey: env.LANGBASE_API_KEY,
  });

  const { step } = new Workflow({
    debug: true,
  });

  // Step 1: Gather event requirements
  const eventRequirements = await step({
    id: "gather_event_requirements",
    run: async () => {
      // Define schema for event requirements
      const eventRequirementsSchema = z.object({
        eventType: z
          .string()
          .describe(
            "Type of event (e.g., wedding, corporate meeting, birthday party)"
          ),
        attendeeCount: z.number().describe("Estimated number of attendees"),
        budget: z.number().describe("Total budget in USD"),
        location: z
          .string()
          .describe("City or region where the event will take place"),
        dateTime: z.string().describe("Planned date and time for the event"),
        duration: z.number().describe("Expected duration in hours"),
        preferences: z.object({
          theme: z.string().describe("Theme or style preference"),
          foodPreferences: z
            .string()
            .describe("Food preferences or dietary restrictions"),
          mustHaveElements: z
            .array(z.string())
            .describe("Elements that must be included in the event"),
        }),
        additionalNotes: z
          .string()
          .describe("Any additional information or special requests"),
        stakeholderEmails: z
          .array(z.string())
          .describe(
            "Email addresses of stakeholders to receive the event brief"
          ),
      });

      const eventSchema = zodToJsonSchema(eventRequirementsSchema, {
        target: "openAi",
      });

      const response = await langbase.agent.run({
        model: "openai:gpt-4.1-mini",
        apiKey: env.OPENAI_API_KEY,
        instructions: `You are Evana, an AI event planning assistant. Extract event requirements from the user's input. 
        If the user hasn't provided enough information, make reasonable assumptions based on the event type and other details provided.
        For missing information, use industry standards and best practices to fill in the gaps.
        If stakeholder emails aren't provided, leave as an empty array.`,
        input: [{ role: "user", content: input }],
        stream: false,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "EventRequirements",
            schema: eventSchema,
            strict: true,
          },
        },
      });

      return JSON.parse(response.output);
    },
  });

  // Step 2: Generate event agenda
  const eventAgenda = await step({
    id: "generate_event_agenda",
    run: async () => {
      // Define schema for event agenda
      const agendaItemSchema = z.object({
        startTime: z.string().describe("Start time of the agenda item"),
        endTime: z.string().describe("End time of the agenda item"),
        activity: z.string().describe("Description of the activity"),
        location: z
          .string()
          .describe("Location where the activity takes place"),
        notes: z.string().describe("Additional notes about the activity"),
      });

      const eventAgendaSchema = z.object({
        agendaItems: z
          .array(agendaItemSchema)
          .describe("List of agenda items for the event"),
      });

      const agendaSchema = zodToJsonSchema(eventAgendaSchema, {
        target: "openAi",
      });

      const response = await langbase.agent.run({
        model: "openai:gpt-4.1-mini",
        apiKey: env.OPENAI_API_KEY,
        instructions: `Based on the event requirements, create a detailed agenda for the event. 
        Include appropriate breaks, meal times, and activities based on the event type and duration.
        Make sure the agenda is realistic and follows industry best practices for the specific event type.`,
        input: [
          {
            role: "user" as Role,
            content: `Create an agenda for my event with these requirements: ${JSON.stringify(
              eventRequirements
            )}`,
          },
        ],
        stream: false,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "EventAgenda",
            schema: agendaSchema,
            strict: true,
          },
        },
      });

      return JSON.parse(response.output);
    },
  });

  // Step 3: Search for real vendors using web search tool
  const vendorSearchResults = await step({
    id: "search_vendors",
    run: async () => {
      // Define web search tool schema
      const webSearchToolSchema = {
        type: "function" as const,
        function: {
          name: "search_vendors",
          description:
            "Search the web for vendors in a specific location for a specific event type",
          parameters: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "The search query to find vendors",
              },
              totalResults: {
                type: "number",
                description: "Number of results to return",
              },
            },
            additionalProperties: false,
          },
          strict: true,
        },
      };

      // Function to implement the web search tool
      async function search_vendors(args) {
        const { query, totalResults = 5 } = JSON.parse(args);

        try {
          const results = await langbase.tools.webSearch({
            service: "exa",
            query: query,
            totalResults: totalResults,
            apiKey: env.EXA_API_KEY,
          });

          return JSON.stringify(results);
        } catch (error) {
          console.error("Error searching for vendors:", error);
          return JSON.stringify([
            {
              url: "https://example.com/error",
              content: "Error searching for vendors. Please try again later.",
            },
          ]);
        }
      }

      // Run the agent with the web search tool
      let inputMessages: PromptMessage[] = [
        {
          role: "user" as Role,
          content: `Find top vendors for ${eventRequirements.eventType} events in ${eventRequirements.location} \
          with a budget of $${eventRequirements.budget} for ${eventRequirements.attendeeCount} people. \
          I need catering, venue, and entertainment options.`,
        },
      ];

      const response = await langbase.agent.run({
        model: "openai:gpt-4.1-mini",
        apiKey: env.OPENAI_API_KEY,
        instructions:
          "You are an event planning assistant. Use the search tool to find relevant vendors for the event.",
        input: inputMessages,
        tools: [webSearchToolSchema],
        stream: false,
      });

      // Process tool calls if any
      inputMessages.push({
        role: response.choices[0].message.role as Role,
        content: response.choices[0].message.content ?? "",
      });
      const toolCalls = response.choices[0].message.tool_calls || [];

      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const { name, arguments: args } = toolCall.function;
          const result = await search_vendors(args);

          inputMessages.push({
            role: "tool" as Role,
            content: result,
            ...(toolCall.id ? { tool_call_id: toolCall.id } : {}),
          });
        }
      }

      // Get the final response with vendor information
      const finalResponse = await langbase.agent.run({
        model: "openai:gpt-4.1-mini",
        apiKey: env.OPENAI_API_KEY,
        instructions:
          "Summarize the search results into a structured list of vendor recommendations.",
        input: inputMessages,
        stream: false,
      });

      return finalResponse.output;
    },
  });

  // Step 4: Crawl venue websites for detailed information
  const venueDetails = await step({
    id: "crawl_venues",
    run: async () => {
      // Define web crawler tool schema
      const webCrawlerToolSchema = {
        type: "function" as const,
        function: {
          name: "crawl_venue_website",
          description: "Crawl a venue website to gather detailed information",
          parameters: {
            type: "object",
            required: ["url"],
            properties: {
              url: {
                type: "string",
                description: "The URL of the venue website to crawl",
              },
              maxPages: {
                type: "number",
                description: "Maximum number of pages to crawl",
              },
            },
            additionalProperties: false,
          },
          strict: true,
        },
      };

      // Function to implement the web crawler tool
      async function crawl_venue_website(args) {
        const { url, maxPages = 3 } = JSON.parse(args);

        try {
          const results = await langbase.tools.crawl({
            url: [url],
            maxPages: maxPages,
            apiKey: env.SPIDERCLOUD_API_KEY,
          });

          return JSON.stringify(results);
        } catch (error) {
          console.error("Error crawling venue website:", error);
          return JSON.stringify([
            {
              url: url,
              content: "Error crawling venue website. Please try again later.",
            },
          ]);
        }
      }

      // Extract venue URLs from vendor search results
      let inputMessages = [
        {
          role: "user" as Role,
          content: `Extract venue URLs from these vendor search results and crawl them to get detailed information:
          ${vendorSearchResults}`,
        },
      ];

      const response = await langbase.agent.run({
        model: "openai:gpt-4.1-mini",
        apiKey: env.OPENAI_API_KEY,
        instructions:
          "You are an event planning assistant. Extract venue URLs from the search results and use the crawler tool to gather detailed information.",
        input: inputMessages,
        tools: [webCrawlerToolSchema],
        stream: false,
      });

      // Process tool calls if any
      inputMessages.push({
        role: response.choices[0].message.role as Role,
        content: response.choices[0].message.content ?? "",
      });
      const toolCalls = response.choices[0].message.tool_calls || [];

      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const { name, arguments: args } = toolCall.function;
          const result = await crawl_venue_website(args);

          inputMessages.push({
            role: "tool" as Role,
            content: result,
            ...(toolCall.id ? { tool_call_id: toolCall.id } : {}),
          });
        }
      }

      // Get the final response with venue details
      const finalResponse = await langbase.agent.run({
        model: "openai:gpt-4.1-mini",
        apiKey: env.OPENAI_API_KEY,
        instructions:
          "Summarize the venue information into a structured format with key details like capacity, amenities, pricing, and availability.",
        input: inputMessages,
        stream: false,
      });

      return finalResponse.output;
    },
  });

  // Step 5: Create timeline and checklist
  const timelineChecklist = await step({
    id: "create_timeline_checklist",
    run: async () => {
      // Define schema for timeline and checklist
      const checklistItemSchema = z.object({
        task: z.string().describe("Task to be completed"),
        deadline: z.string().describe("Deadline for completing the task"),
        category: z
          .string()
          .describe("Category of the task (e.g., venue, catering, logistics)"),
        status: z
          .string()
          .describe("Status of the task (Not Started, In Progress, Completed)"),
      });

      const timelineChecklistSchema = z.object({
        checklistItems: z
          .array(checklistItemSchema)
          .describe("List of tasks to be completed for the event"),
      });

      const checklistSchema = zodToJsonSchema(timelineChecklistSchema, {
        target: "openAi",
      });

      const response = await langbase.agent.run({
        model: "openai:gpt-4.1-mini",
        apiKey: env.OPENAI_API_KEY,
        instructions: `Based on the event requirements, agenda, and vendor information, create a timeline and checklist
        for planning the event. Include all necessary tasks with realistic deadlines working backward from the event date.
        Categorize tasks appropriately and set all initial statuses to "Not Started".`,
        input: [
          {
            role: "user" as Role,
            content: `Create a planning timeline and checklist for my ${
              eventRequirements.eventType
            } on ${eventRequirements.dateTime}.
            Here's my agenda: ${JSON.stringify(eventAgenda)}
            Vendor information: ${vendorSearchResults}
            Venue details: ${venueDetails}`,
          },
        ],
        stream: false,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "TimelineChecklist",
            schema: checklistSchema,
            strict: true,
          },
        },
      });

      return JSON.parse(response.output);
    },
  });

  // Step 6: Generate event brief
  const eventBrief = await step({
    id: "generate_event_brief",
    run: async () => {
      const { output } = await langbase.agent.run({
        model: "openai:gpt-4.1-mini",
        apiKey: env.OPENAI_API_KEY,
        instructions: `Create a comprehensive event brief based on all the information gathered.
        The brief should be well-structured, professional, and ready to share with stakeholders.
        Include sections for event overview, agenda, vendor recommendations, venue details, and planning timeline.
        Format the output in markdown for easy conversion to PDF or document format.`,
        input: [
          {
            role: "user" as Role,
            content: `Create an event brief for my ${
              eventRequirements.eventType
            } with the following details:
            
            Event Requirements: ${JSON.stringify(eventRequirements)}
            Event Agenda: ${JSON.stringify(eventAgenda)}
            Vendor Information: ${vendorSearchResults}
            Venue Details: ${venueDetails}
            Planning Timeline: ${JSON.stringify(timelineChecklist)}`,
          },
        ],
        stream: false,
      });

      return output;
    },
  });

  // Step 7: Send event brief via email
  const emailResult = await step({
    id: "send_email",
    run: async () => {
      // Define email tool schema
      const emailToolSchema = {
        type: "function" as const,
        function: {
          name: "send_email",
          description: "Send an email with the event brief to stakeholders",
          parameters: {
            type: "object",
            required: ["to", "subject", "body"],
            properties: {
              to: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Email addresses of recipients",
              },
              subject: {
                type: "string",
                description: "Email subject line",
              },
              body: {
                type: "string",
                description: "Email body content (can be HTML)",
              },
            },
            additionalProperties: false,
          },
          strict: true,
        },
      };

      // Function to implement the email tool
      async function send_email(args) {
        const { to, subject, body } = JSON.parse(args);

        // This is a dummy implementation. In a real application, you would integrate with an email service
        console.log(`Sending email to: ${to.join(", ")}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body.substring(0, 100)}...`);

        // Simulate email sending
        return JSON.stringify({
          success: true,
          message: `Email sent successfully to ${to.length} recipient(s)`,
          recipients: to,
        });
      }

      // Only proceed with email if stakeholder emails are provided
      if (
        eventRequirements.stakeholderEmails &&
        eventRequirements.stakeholderEmails.length > 0
      ) {
        let inputMessages: PromptMessage[] = [
          {
            role: "user" as Role,
            content: `Send the event brief to the following stakeholders: ${eventRequirements.stakeholderEmails.join(
              ", "
            )}. 
            The event brief is: ${eventBrief.substring(0, 500)}...`,
          },
        ];

        const response = await langbase.agent.run({
          model: "openai:gpt-4.1-mini",
          apiKey: env.OPENAI_API_KEY,
          instructions:
            "You are an event planning assistant. Create an email with the event brief and send it to the stakeholders.",
          input: inputMessages,
          tools: [emailToolSchema],
          stream: false,
        });

        // Process tool calls if any
        inputMessages.push({
          role: response.choices[0].message.role as Role,
          content: response.choices[0].message.content ?? "",
        });
        const toolCalls = response.choices[0].message.tool_calls || [];

        if (toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            const { name, arguments: args } = toolCall.function;
            const result = await send_email(args);

            inputMessages.push({
              role: "tool" as Role,
              content: result,
              ...(toolCall.id ? { tool_call_id: toolCall.id } : {}),
            });
          }
        }

        // Get the final response after sending email
        const finalResponse = await langbase.agent.run({
          model: "openai:gpt-4.1-mini",
          apiKey: env.OPENAI_API_KEY,
          instructions:
            "Confirm that the email has been sent and provide a summary of what was sent.",
          input: inputMessages,
          stream: false,
        });

        return finalResponse.output;
      } else {
        return "No stakeholder emails provided. Event brief was not sent via email.";
      }
    },
  });

  return {
    eventRequirements,
    eventAgenda,
    vendorSearchResults,
    venueDetails,
    timelineChecklist,
    eventBrief,
    emailResult,
  };
}

async function main(event, env) {
  const { input } = await event.json();
  const result = await evanaWorkflow({ input, env });
  return result;
}

export default main;
