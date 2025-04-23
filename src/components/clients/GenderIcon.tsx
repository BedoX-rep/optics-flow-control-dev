
import React from "react";
import { User, UserRound, Baby } from "lucide-react";

interface GenderIconProps {
  gender: string;
  size?: number;
}

const GenderIcon: React.FC<GenderIconProps> = ({ gender, size = 24 }) => {
  switch (gender) {
    case "Mr":
      return <User size={size} />;
    case "Mme":
      return <UserRound size={size} />;
    case "Enf":
      return <Baby size={size} />;
    default:
      return <User size={size} />;
  }
};

export default GenderIcon;
