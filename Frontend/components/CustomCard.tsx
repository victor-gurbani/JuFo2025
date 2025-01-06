import React from "react";
import { Card } from "react-native-paper";
// unused!! 
const CustomCard = ({ children, style, ...props }) => {
  return (
    <Card elevation={5} style={[{ margin: 10 }, style]} {...props}>
      {children}
    </Card>
  );
};

export default CustomCard;