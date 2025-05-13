import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, Video, MapPin, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function StudySessions() {
  // Mock data for study sessions
  const studySessions = [
    {
      id: 1,
      subject: "Mathematics",
      date: "2023-05-15T14:00:00",
      isVirtual: true,
      participants: [
        { name: "John Doe", image: "https://github.com/shadcn.png" },
        { name: "Jane Smith", image: null },
        { name: "Alex Johnson", image: "https://github.com/shadcn.png" },
      ],
    },
    {
      id: 2,
      subject: "Physics",
      date: "2023-05-16T10:00:00",
      isVirtual: false,
      participants: [
        { name: "Emily Brown", image: null },
        { name: "Michael Wilson", image: "https://github.com/shadcn.png" },
      ],
    },
    {
      id: 3,
      subject: "Computer Science",
      date: "2023-05-17T16:30:00",
      isVirtual: true,
      participants: [
        { name: "Sarah Davis", image: "https://github.com/shadcn.png" },
        { name: "David Miller", image: null },
        { name: "Lisa Garcia", image: "https://github.com/shadcn.png" },
        { name: "Robert Taylor", image: null },
      ],
    },
    {
      id: 4,
      subject: "Biology",
      date: "2023-05-18T13:00:00",
      isVirtual: false,
      participants: [
        { name: "Jennifer Lee", image: "https://github.com/shadcn.png" },
        { name: "William Anderson", image: null },
        { name: "Karen Thomas", image: "https://github.com/shadcn.png" },
      ],
    },
    {
      id: 5,
      subject: "History",
      date: "2023-05-19T15:00:00",
      isVirtual: true,
      participants: [
        { name: "Daniel White", image: null },
        { name: "Michelle Harris", image: "https://github.com/shadcn.png" },
      ],
    },
    {
      id: 6,
      subject: "Chemistry",
      date: "2023-05-20T11:00:00",
      isVirtual: false,
      participants: [
        { name: "Christopher Martin", image: "https://github.com/shadcn.png" },
        { name: "Jessica Thompson", image: null },
        { name: "Matthew Robinson", image: "https://github.com/shadcn.png" },
      ],
    },
  ];

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Study Sessions</h1>
        <Button className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Create Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studySessions.map((session) => (
          <Card
            key={session.id}
            className="hover:shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            <CardHeader>
              <CardTitle className="text-xl">{session.subject}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{formatDate(session.date)}</span>
                </div>

                <div className="flex items-center">
                  {session.isVirtual ? (
                    <Video className="w-4 h-4 mr-2 text-muted-foreground" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  )}
                  <Badge variant={session.isVirtual ? "secondary" : "outline"}>
                    {session.isVirtual ? "Virtual" : "In Person"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm mr-2">Participants:</span>
                <div className="flex -space-x-2">
                  {session.participants
                    .slice(0, 3)
                    .map((participant, index) => (
                      <Avatar key={index} className="w-8 h-8">
                        {participant.image ? (
                          <AvatarImage
                            src={participant.image}
                            alt={participant.name}
                          />
                        ) : (
                          <AvatarFallback>
                            {participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    ))}
                  {session.participants.length > 3 && (
                    <Avatar className="border border-background w-8 h-8">
                      <AvatarFallback>
                        +{session.participants.length - 3}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-1">
              <Button className="text-sm h-auto cursor-pointer">
                Join session
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
