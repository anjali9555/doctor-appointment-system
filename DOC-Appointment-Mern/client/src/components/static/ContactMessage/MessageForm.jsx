import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { sendWebMessage } from "../../../redux/actions/authActions"; // Path check kar lena apne folder ke hisaab se

const MessageForm = () => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState(""); // 💡 Tutorial ka 'conatact' typo fix kar diya hai

  const dispatch = useDispatch();

  const handleMessage = () => {
    if (!name || !contact || !message) {
      return toast.error("Please Provide name or contact or message");
    }
    
    // Backend ke liye data prepare kar rahe hain
    const msgData = { name, contact, message };

    // 🔥 .unwrap() ka use kiya hai taaki API poori hone ke baad hi Toast aaye (Tutorial mein yeh bug tha)
    dispatch(sendWebMessage(msgData))
      .unwrap()
      .then((res) => {
        toast.success("Message sent successfully!");
        // Message send hone ke baad form khali kar do
        setName("");
        setContact("");
        setMessage("");
      })
      .catch((err) => {
        toast.error(err || "Failed to send message");
      });
  };

  return (
    <>
      <div className="mform">
        <h1>Send Us Message</h1>
        
        <input
          type="text"
          placeholder="enter your name"
          required={true}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        
        <input
          type="email"
          placeholder="enter your email"
          required={true}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        
        <textarea
          placeholder="enter your message"
          name="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
        
        <button className="btn" onClick={handleMessage}>
          Send Message
        </button>
      </div>
    </>
  );
};

export default MessageForm;