import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
  Palette,
  Utensils,
  CheckSquare,
  FileText,
  Search,
  Globe,
  Mail,
} from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { ScrollArea } from "./components/ui/scroll-area";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

// Define the expected shape of the result object
interface EventRequirements {
  eventType: string;
  attendeeCount: number;
  budget: number;
  location: string;
  dateTime: string;
  duration: number;
  preferences: {
    theme: string;
    foodPreferences: string;
    mustHaveElements: string[];
  };
  additionalNotes?: string;
  stakeholderEmails?: string[];
}

interface AgendaItem {
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  notes?: string;
}

interface VendorRecommendation {
  category: string;
  recommendations: {
    name: string;
    description: string;
    estimatedCost: string;
    contactInfo: string;
  }[];
}

interface TimelineChecklistItem {
  task: string;
  deadline: string;
  category: string;
  status: string;
}

interface ResultType {
  eventRequirements: EventRequirements;
  eventAgenda?: { agendaItems: AgendaItem[] };
  vendorRecommendations?: { vendors: VendorRecommendation[] };
  venueDetails?: string;
  timelineChecklist?: { checklistItems: TimelineChecklistItem[] };
  eventBrief?: string;
  emailResult?: string;
}

export function Agent() {
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ResultType | undefined>(undefined);
  const [activeTab, setActiveTab] = React.useState("requirements");
  const [emailStatus, setEmailStatus] = React.useState<null | "success">(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      toast.warning("Please enter your event details", {
        closeButton: true,
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      // Parse the response
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Check for error conditions
      if (!response.ok) {
        const errorMessage =
          typeof data === "object" && data.error
            ? data.error
            : `Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      setResult(data);

      // Check if email was sent
      if (data.emailResult && data.emailResult.includes("successfully")) {
        setEmailStatus("success");
        toast.success("Event plan created and email sent successfully!", {
          closeButton: true,
          duration: 3000,
        });
      } else {
        toast.success("Event plan created successfully!", {
          closeButton: true,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error(error.message || "Failed to create event plan", {
        closeButton: true,
        duration: Infinity,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderRequirements = () => {
    if (!result?.eventRequirements) return null;

    const { eventRequirements } = result;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">
                    {eventRequirements.eventType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-medium">
                    {eventRequirements.dateTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {eventRequirements.duration} hours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">
                    {eventRequirements.location}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendance & Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attendees:</span>
                  <span className="font-medium">
                    {eventRequirements.attendeeCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">
                    ${eventRequirements.budget.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-muted-foreground">Theme:</span>
                <p>{eventRequirements.preferences.theme}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Food Preferences:</span>
                <p>{eventRequirements.preferences.foodPreferences}</p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Must-Have Elements:
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {eventRequirements.preferences.mustHaveElements.map(
                    (element, i) => (
                      <Badge key={i} variant="secondary">
                        {element}
                      </Badge>
                    )
                  )}
                </div>
              </div>
              {eventRequirements.additionalNotes && (
                <div>
                  <span className="text-muted-foreground">
                    Additional Notes:
                  </span>
                  <p>{eventRequirements.additionalNotes}</p>
                </div>
              )}
              {eventRequirements.stakeholderEmails &&
                eventRequirements.stakeholderEmails.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">
                      Stakeholder Emails:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {eventRequirements.stakeholderEmails.map((email, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {emailStatus === "success" && (
          <Alert className="bg-green-500/10 border-green-500/50">
            <Mail className="h-4 w-4" />
            <AlertTitle>Email Sent Successfully</AlertTitle>
            <AlertDescription>
              The event brief has been emailed to all stakeholders.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderAgenda = () => {
    if (!result?.eventAgenda?.agendaItems) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Event Agenda
          </CardTitle>
          <CardDescription>Detailed timeline for your event</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {result.eventAgenda.agendaItems.map((item, index) => (
                <div
                  key={index}
                  className="border-l-2 border-primary pl-4 pb-4 relative"
                >
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{item.activity}</h4>
                      <Badge variant="outline" className="ml-2">
                        {item.startTime} - {item.endTime}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Location:</span>{" "}
                      {item.location}
                    </div>
                    {item.notes && <p className="text-sm mt-1">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  const renderVendors = () => {
    if (!result?.vendorRecommendations?.vendors) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Vendor Search Results
            </CardTitle>
            <CardDescription>Vendors found through web search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary/30 p-3 rounded-md mb-4">
              <p className="text-sm text-muted-foreground">
                Vendors were found using real-time web search for{" "}
                {result.eventRequirements.eventType} events in{" "}
                {result.eventRequirements.location}.
              </p>
            </div>
            <Accordion className="w-full">
              {result?.vendorRecommendations?.vendors?.map(
                (category, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {category.category}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {category.recommendations.map((vendor, vIndex) => (
                          <Card key={vIndex} className="bg-secondary/30">
                            <CardHeader className="py-3">
                              <CardTitle className="text-base">
                                {vendor.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-0">
                              <p className="text-sm">{vendor.description}</p>
                              <div className="flex justify-between mt-2 text-sm">
                                <span className="text-muted-foreground">
                                  Estimated Cost:
                                </span>
                                <span>{vendor.estimatedCost}</span>
                              </div>
                              <div className="flex justify-between mt-1 text-sm">
                                <span className="text-muted-foreground">
                                  Contact:
                                </span>
                                <span>{vendor.contactInfo}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              )}
            </Accordion>
          </CardContent>
        </Card>

        {result.venueDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Venue Details
              </CardTitle>
              <CardDescription>
                Detailed venue information from web crawling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/30 p-3 rounded-md mb-4">
                <p className="text-sm text-muted-foreground">
                  Venue details were gathered by crawling venue websites to
                  provide accurate and up-to-date information.
                </p>
              </div>
              <div className="prose prose-invert max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: result.venueDetails
                      .replace(/^# /gm, "<h1>")
                      .replace(/^## /gm, "<h2>")
                      .replace(/^### /gm, "<h3>")
                      .replace(/\n\n/g, "</p><p>")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderChecklist = () => {
    if (!result?.timelineChecklist?.checklistItems) return null;

    // Group checklist items by category
    const groupedItems = result.timelineChecklist.checklistItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {}
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Planning Timeline & Checklist
          </CardTitle>
          <CardDescription>Tasks to complete before your event</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <Accordion className="w-full">
              {Object.entries(groupedItems).map(([category, items], index) => (
                <AccordionItem key={index} value={`category-${index}`}>
                  <AccordionTrigger className="text-left">
                    {category}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {(items as TimelineChecklistItem[]).map(
                        (item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-start justify-between border-b pb-2"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.task}</p>
                              <p className="text-sm text-muted-foreground">
                                Deadline: {item.deadline}
                              </p>
                            </div>
                            <Badge
                              variant={
                                item.status === "Completed"
                                  ? "default"
                                  : item.status === "In Progress"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="ml-2"
                            >
                              {item.status}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  const renderBrief = () => {
    if (!result?.eventBrief) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Event Brief
          </CardTitle>
          <CardDescription>
            Comprehensive overview of your event plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="prose prose-invert max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: result.eventBrief
                    .replace(/^# /gm, "<h1>")
                    .replace(/^## /gm, "<h2>")
                    .replace(/^### /gm, "<h3>")
                    .replace(/\n\n/g, "</p><p>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                }}
              />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full">Download Event Brief</Button>
          {result.eventRequirements.stakeholderEmails &&
            result.eventRequirements.stakeholderEmails.length > 0 && (
              <div className="w-full text-center text-sm text-muted-foreground">
                {emailStatus === "success" ? (
                  <span className="flex items-center justify-center gap-1">
                    <Mail className="h-3 w-3" />
                    Event brief sent to{" "}
                    {result.eventRequirements.stakeholderEmails.length}{" "}
                    stakeholder(s)
                  </span>
                ) : (
                  <span>Email delivery status: Pending</span>
                )}
              </div>
            )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Evana Event Planner</h1>
          <p className="text-muted-foreground">
            Your AI event planning assistant. Describe your event and get a
            complete plan in seconds.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Describe Your Event</CardTitle>
            <CardDescription>
              Tell us about the event you want to plan. Include details like
              type, location, budget, and any specific preferences. You can also
              include stakeholder emails to receive the event brief.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-description">Event Description</Label>
                  <Textarea
                    id="event-description"
                    placeholder="I'm planning a corporate retreat in Miami for 50 people with a budget of $25,000. We want team-building activities and a beach theme. Please send the brief to john@example.com and sarah@example.com."
                    className="min-h-[120px]"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
                <div className="bg-secondary/30 p-3 rounded-md">
                  <h3 className="text-sm font-medium mb-2">
                    Enhanced with powerful tools:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-primary" />
                      <span className="text-xs">
                        Web search for real vendors
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-xs">
                        Web crawler for venue details
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-xs">
                        Email integration for stakeholders
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Your Event Plan...
                    </>
                  ) : (
                    "Create Event Plan"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Tabs
              defaultValue="requirements"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="vendors">Vendors</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="brief">Event Brief</TabsTrigger>
              </TabsList>
              <TabsContent value="requirements" className="mt-6">
                {renderRequirements()}
              </TabsContent>
              <TabsContent value="agenda" className="mt-6">
                {renderAgenda()}
              </TabsContent>
              <TabsContent value="vendors" className="mt-6">
                {renderVendors()}
              </TabsContent>
              <TabsContent value="checklist" className="mt-6">
                {renderChecklist()}
              </TabsContent>
              <TabsContent value="brief" className="mt-6">
                {renderBrief()}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
