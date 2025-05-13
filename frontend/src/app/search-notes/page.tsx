import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, Save, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function SearchNotes() {
  // Mock data for search notes
  const searchNotes = [
    {
      id: 1,
      title: "Mathematics",
      content:
        "This note covers fundamental concepts in algebra, calculus, and geometry. It's perfect for students preparing for exams.",
      author: "John Doe",
      authorImage: "https://github.com/shadcn.png",
      tags: ["algebra", "calculus", "geometry"],
    },
    {
      id: 2,
      title: "Physics",
      content:
        "Explore the principles of mechanics, thermodynamics, and electromagnetism. This note is a great resource for understanding the physical world.",
      author: "Jane Smith",
      authorImage: null,
      tags: ["mechanics", "thermodynamics", "electromagnetism"],
    },
    {
      id: 3,
      title: "Computer Science",
      content:
        "Dive into data structures, algorithms, and software engineering. Ideal for aspiring programmers and computer scientists.",
      author: "Alex Johnson",
      authorImage: "https://github.com/shadcn.png",
      tags: ["data structures", "algorithms", "software engineering"],
    },
    {
      id: 4,
      title: "Biology",
      content:
        "Learn about cell biology, genetics, and ecology. This note provides a comprehensive overview of life sciences.",
      author: "Emily Brown",
      authorImage: null,
      tags: ["cell biology", "genetics", "ecology"],
    },
    {
      id: 5,
      title: "History",
      content:
        "Examine major historical events, figures, and movements. A valuable resource for history enthusiasts and students.",
      author: "Michael Wilson",
      authorImage: "https://github.com/shadcn.png",
      tags: ["world history", "political science", "social movements"],
    },
    {
      id: 6,
      title: "Chemistry",
      content:
        "Understand chemical reactions, atomic structure, and organic chemistry. Essential for chemistry students and researchers.",
      author: "Sarah Davis",
      authorImage: null,
      tags: ["chemical reactions", "atomic structure", "organic chemistry"],
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Search Notes</h1>
        <Input
          type="text"
          placeholder="Search notes"
          className="w-full max-w-md"
        />
        <Button className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Create Note
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchNotes.map((note) => (
          <Card
            key={note.id}
            className="h-72 w-full hover:shadow-md transition-all cursor-pointer duration-300 hover:scale-[1.02]"
          >
            <CardHeader>
              <CardTitle className="text-xl">
                <div className="flex items-center">
                  {note.title}
                  <div className="flex items-center mb-2 ml-auto">
                    <Avatar className="w-6 h-6 mr-2">
                      {note.authorImage ? (
                        <AvatarImage src={note.authorImage} alt={note.author} />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {note.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {note.author}
                    </span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{note.content}</p>
              <div>
                {note.tags &&
                  note.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="mr-1.5 mb-1.5"
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>
            </CardContent>
            <CardFooter className="flex h-full items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ThumbsUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <ThumbsDown className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-sm h-auto cursor-pointer"
              >
                <Save className="w-4 h-4 mr-2" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
