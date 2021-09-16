---
description: A demo application consuming the Huddle01 Client SDK
---

# Demo App

{% tabs %}
{% tab title="App.js" %}
```jsx
import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import Room from "./containers/Room";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/room" component={Room} />
        <Route path="/" component={() => <Redirect to="/room" />} />
      </Switch>
    </Router>
  );
}

export default App;
```
{% endtab %}

{% tab title="Room.js" %}
```jsx
//client sdk import
import HuddleClient, { emitter } from "huddle01-client";

//react imports
import { useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";

//helper imports
import { getTrack } from "../lib/utils/helpers";
import { PeerVideo, PeerAudio, PeerScreen } from "../components/PeerViewport";

function Room() {
  const history = useHistory();
  //to allow for recordings
  const isBot = localStorage.getItem("bot_password") === "huddle01";
  //initialising states
  const [huddle, setHuddle] = useState(null);
  const [roomState, setRoomState] = useState(false);
  const [micState, setMicState] = useState(false);
  const [webcamState, setWebcamState] = useState(false);
  const [screenshareState, setScreenshareState] = useState(false);

  const [peers, setPeers] = useState([]);
  const [consumerStreams, setConsumerStreams] = useState({
    video: [],
    audio: [],
    screen: [],
  });

  const meVideoElem = useRef(null);
  const meScreenElem = useRef(null);
  const joinRoomBtn = useRef(null);

  const config = {
    apiKey: "your-api-key-here",
    roomId: "C132",
    peerId: "Rick" + Math.floor(Math.random() * 4000),
    displayName: "Rick Sanchez",
    window,
    isBot, // true/false -- gets calculated on line 15
  };

  //initialize the app
  useEffect(() => {
    history.push(`?roomId=${config.roomId}`);

    const myHuddleClient = new HuddleClient(config);
    setHuddle(myHuddleClient);
  }, []);

  //recording config
  useEffect(() => {
    //joinRoomBtn here can be whatever button/function used that calls `huddle.join()`
    huddle && isBot && joinRoomBtn.current.click();
  }, [huddle, isBot]);

  const setupEventListeners = async () => {
    emitter.on("roomState", (state) => {
      switch (state) {
        case "connected":
          //do whatever
          break;
        case "failed":
          //do whatever
          break;
        case "disconnected":
          //do whatever
          break;
        default:
          break;
      }
      setRoomState(state);
    });

    emitter.on("error", (error) => {
      alert(error);
      //do whatever
    });

    emitter.on("addPeer", (peer) => {
      console.log("new peer =>", peer);
      setPeers((_peers) => [..._peers, peer]);
    });

    emitter.on("addProducer", (producer) => {
      console.log("new prod", producer);
      switch (producer.type) {
        case "webcam":
          const videoStream = producer.track;
          if (typeof videoStream == "object") {
            try {
              meVideoElem.current.srcObject = getTrack(videoStream);
            } catch (error) {
              console.error(error);
            }
          }
          break;
        case "mic":
          //do whatever
          break;
        case "screen":
          const videoStream = producer.track;
          if (typeof videoStream == "object") {
            try {
              meScreenElem.current.srcObject = getTrack(videoStream);
            } catch (error) {
              console.error(error);
            }
          }
          break;

        default:
          break;
      }
    });

    emitter.on("removeProducer", (producer) => {
      console.log("remove ", producer);
      switch (producer.type) {
        case "webcam":
          try {
            meVideoElem.current.srcObject = null;
          } catch (error) {
            console.error(error);
          }
          break;
        case "mic":
          //do whatever
          break;
        case "screen":
          try {
            meScreenElem.current.srcObject = null;
          } catch (error) {
            console.error(error);
          }
          break;

        default:
          break;
      }
    });

    emitter.on("addConsumer", (consumer) => {
      switch (consumer.type) {
        case "webcam": {
          const videoStream = consumer.track;
          setConsumerStreams((prevState) => ({
            ...prevState,
            video: [...prevState.video, videoStream],
          }));

          break;
        }

        case "screen": {
          const screenStream = consumer.track;
          setConsumerStreams((prevState) => ({
            ...prevState,
            screen: [...prevState.screen, screenStream],
          }));
          break;
        }

        case "mic": {
          const audioStream = consumer.track;
          setConsumerStreams((prevState) => ({
            ...prevState,
            audio: [...prevState.audio, audioStream],
          }));

          break;
        }

        default:
          break;
      }
    });

    emitter.on("removeConsumer", (consumer) => {
      switch (consumer.type) {
        case "screen":
          setConsumerStreams((prevState) => {
            return {
              ...prevState,
              screen: prevState.screen.filter(
                (_consumer) => _consumer.id !== consumer._id
              ),
            };
          });
          break;
        case "webcam":
          setConsumerStreams((prevState) => {
            return {
              ...prevState,
              video: prevState.video.filter(
                (_consumer) => _consumer.id !== consumer._id
              ),
            };
          });
          break;
        case "mic":
          setConsumerStreams((prevState) => {
            return {
              ...prevState,
              audio: prevState.audio.filter(
                (_consumer) => _consumer.id !== consumer._id
              ),
            };
          });
          break;

        default:
          break;
      }
    });
  };

  const joinRoom = async () => {
    if (!huddle) return;

    try {
      setupEventListeners();
      await huddle.join();
    } catch (error) {
      alert(error);
    }
  };

  const leaveRoom = async () => {
    if (!huddle) return;
    try {
      await huddle.close();
      setRoomState(false);
    } catch (error) {
      alert(error);
    }
  };

  //TODO: add pauseWebcam() and resumeWebcam()
  const enableWebcam = async () => {
    if (!huddle) return;
    try {
      await huddle.enableWebcam();
      setWebcamState(true);
    } catch (error) {
      setWebcamState(false);
      alert(error);
    }
  };

  const disableWebcam = async () => {
    if (!huddle) return;
    try {
      await huddle.disableWebcam();
      setWebcamState(false);
    } catch (error) {
      alert(error);
    }
  };

  const startScreenshare = async () => {
    if (!huddle) return;
    try {
      await huddle.enableShare();
      setScreenshareState(true);
    } catch (error) {
      alert(error);
      setScreenshareState(false);
    }
  };

  const stopScreenshare = async () => {
    if (!huddle) return;
    try {
      await huddle.disableShare();
      setScreenshareState(false);
    } catch (error) {
      alert(error);
    }
  };

  //TODO: add muteMic() and unmuteMic()
  const enableMic = async () => {
    if (!huddle) return;
    try {
      huddle.enableMic();
      setMicState(true);
    } catch (error) {
      setMicState(false);
      alert(error);
    }
  };

  const disableMic = async () => {
    if (!huddle) return;
    try {
      huddle.disableMic();
      setMicState(false);
    } catch (error) {
      alert(error);
      setMicState(true);
    }
  };

  const startRecording = async () => {
    if (!huddle) return;
    try {
      const status = await huddle.startRecording();
      if (status) console.log("recording successfully initiated");
    } catch (error) {
      console.error(error);
    }
  };

  const stopRecorder = async () => {
    if (!huddle) return;
    try {
      const status = await huddle.stopRecording();
      if (status) console.log("recording successfully stopped");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="App">
      <div className="me-ports">
        <video height="400px" width="400px" autoPlay ref={meVideoElem} />
        <video height="400px" width="400px" autoPlay ref={meScreenElem} />
      </div>
      <div className="btn-grp">
        <button
          ref={joinRoomBtn}
          id="join-btn"
          onClick={roomState === "connected" ? leaveRoom : joinRoom}
        >
          {roomState === "connected" ? "Leave Room" : "Join Room"}
        </button>
        <button onClick={webcamState ? disableWebcam : enableWebcam}>
          {webcamState ? "Disable Webcam" : "Enable Webcam"}
        </button>
        <button onClick={micState ? disableMic : enableMic}>
          {micState ? "Disable Mic" : "Enable Mic"}
        </button>
        <button onClick={screenshareState ? stopScreenshare : startScreenshare}>
          {screenshareState ? "Disable Screenshare" : "Enable Screenshare"}
        </button>
        {/* <button onClick={toggleWebcam}>Toggle Webcam</button> */}
      </div>

      <div className="peer-ports">
        {consumerStreams.video.map((stream, idx) => {
          return <PeerVideo key={idx} videoTrack={getTrack(stream)} />;
        })}
        {consumerStreams.screen.map((stream, idx) => {
          return <PeerScreen key={idx} screenTrack={getTrack(stream)} />;
        })}
        {consumerStreams.audio.map((stream, idx) => {
          return <PeerAudio key={idx} audioTrack={getTrack(stream)} />;
        })}
      </div>
    </div>
  );
}

export default Room;

```
{% endtab %}

{% tab title="lib/utils/helpers.js" %}
```javascript
export const getTrack = (track) => {
  const stream = new MediaStream();
  stream.addTrack(track);
  return stream;
};
```
{% endtab %}

{% tab title="components/PeerViewport.js" %}
```javascript
import { useEffect, useRef } from "react";

export const PeerVideo = ({ videoTrack }) => {
  const peerVideoTrack = useRef(null);

  useEffect(() => {
    peerVideoTrack.current.srcObject = videoTrack;
  }, []);
  return (
    <div>
      <video ref={peerVideoTrack} height="400px" width="400px" autoPlay />
    </div>
  );
};

export const PeerScreen = ({ screenTrack }) => {
  const peerScreenTrack = useRef(null);

  useEffect(() => {
    peerScreenTrack.current.srcObject = screenTrack;
  }, []);
  return (
    <div>
      <video ref={peerScreenTrack} height="400px" width="400px" autoPlay />
    </div>
  );
};

export const PeerAudio = ({ audioTrack }) => {
  const peerAudioTrack = useRef(null);

  useEffect(() => {
    console.log(audioTrack);
    peerAudioTrack.current.srcObject = audioTrack;
  }, []);
  return (
    <div>
      <audio ref={peerAudioTrack} autoPlay playsInline controls={false} />
    </div>
  );
};
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
The demo app can also be found on [Github](https://github.com/Huddle-01/web-sdk).
{% endhint %}

