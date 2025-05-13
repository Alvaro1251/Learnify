import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  return (
    <div className="container py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-6 items-center">
        <Avatar className="w-24 h-24">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>NN</AvatarFallback>
        </Avatar>

        <div className="flex flex-col gap-2">
          <h1 className="font-medium">Gabriel Viera</h1>
          <p className="text-sm text-muted-foreground">
            sgviera@frd.utn.edu.ar
          </p>
        </div>
      </div>
    </div>
  );
}
