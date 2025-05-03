
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User2, Baby, User } from "lucide-react"

interface ClientAvatarProps {
  gender: "Mr" | "Mme" | "Enf"
  name: string
  className?: string
}

export const ClientAvatar = ({ gender, name, className }: ClientAvatarProps) => {
  const getIcon = () => {
    switch (gender) {
      case "Mr":
        return <User2 className="h-5 w-5" />
      case "Mme":
        return <User className="h-5 w-5" />
      case "Enf":
        return <Baby className="h-5 w-5" />
    }
  }

  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-primary/10">
        {getIcon()}
      </AvatarFallback>
    </Avatar>
  )
}
