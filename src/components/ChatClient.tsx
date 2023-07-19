import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Message } from "../types/ChatType";

const socket = io("http://localhost:5500");

const ChatClient = () => {
  const [room, setRoom] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [typingDisplay, setTypingDisplay] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSend, setIsSend] = useState<boolean>(false);

  useEffect(() => {
    socket.emit("findAllChat", { room: room }, (rs: Message[]) => {
      setMessages(rs);
    });
  });

  useEffect(() => {
    if (isSend) {
      // Listen event from server
      socket.on("message", (msg: Message) => {
        setMessages([...messages, msg]);
      });

      setIsSend(false);
    }
  }, [isSend]);

  useEffect(() => {
    socket.on("typing", ({ name, isTyping }) => {
      if (isTyping) {
        setTypingDisplay(`${name} is typing...`);
      } else {
        setTypingDisplay("");
        setIsTyping(false);
      }
    });
  }, [isTyping]);

  const join = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    socket.emit("join", { name: name, room: room }, (rs: any) => {
      console.log("Joined:", rs);
      setJoined(true);
    });
  };

  const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSend(true);

    socket.emit(
      "createChat",
      { name: name, text: messageText, room: room },
      (rs: Message) => {
        setMessageText("");
        console.log("Chat created", rs);
      }
    );
  };

  const emitTyping = () => {
    let timeout;
    socket.emit("typing", { isTyping: true, room: room });
    setIsTyping(true);

    timeout = setTimeout(() => {
      socket.emit("typing", { isTyping: false });
      setIsTyping(false);
    }, 2000);
  };

  return (
    <>
      {!joined ? (
        <form
          onSubmit={(e) => {
            join(e);
          }}
        >
          <label>Room?</label>
          <br></br>
          <input
            type="text"
            value={room}
            onChange={(e) => {
              setRoom(e.target.value);
            }}
          />
          <br></br>
          <br></br>
          <label>What your name?</label>
          <br></br>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
          <br></br>
          <br></br>
          <button type="submit">Join</button>
        </form>
      ) : (
        <div className="chat-container">
          {messages &&
            messages.map((message: Message, index: number) => {
              return (
                <p key={index}>
                  [{message.name}]: {message.text}
                </p>
              );
            })}

          {typingDisplay && <p>{typingDisplay}</p>}

          <form
            className="chat-input"
            onSubmit={(e) => {
              sendMessage(e);
            }}
            style={{ position: "fixed", bottom: "15px", left: "15px" }}
          >
            <label>Message: </label>
            <input
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                emitTyping();
              }}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatClient;
