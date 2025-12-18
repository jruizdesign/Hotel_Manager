import React,{useState} from "react";
import { getFunctions, HttpsCallable } from "firebase/functions";

import ReCaptcha from "../../reCaptcha";
const LoginComponent = () => {
  const [email, setEmail] = useState ("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");