//client sdk import
import HuddleClient, { emitter, HuddleTypes } from "huddle01-client";

import Web3 from 'web3';
import { AbiItem } from 'web3-utils';

//react imports
import { useEffect, useState, useRef, SetStateAction } from "react";
import { useHistory } from "react-router-dom";

//helper imports
import { getTrack } from "../lib/utils/helpers";
import { PeerVideo, PeerAudio, PeerScreen } from "../components/PeerViewport";

// interfaces
import { IConsumerStreams } from "../interface/interfaces";


declare global {
  interface Window { 
      ethereum: any;
      web3: any;
      contract:any;
      //methods:any;
      Contract:any;
     unlockProtocol:any;
  }
}


function Room() {


  const history = useHistory();
  //to allow for recordings
  const isBot = localStorage.getItem("bot_password") === "huddle01";
  //initialising states
  const [huddle, setHuddle] = useState<HuddleClient | null>(null);
  const [roomState, setRoomState] = useState<string>("");
  const [micState, setMicState] = useState<boolean>(false);
  const [webcamState, setWebcamState] = useState<boolean>(false);
  const [screenshareState, setScreenshareState] = useState<boolean>(false);

  const [peers, setPeers] = useState<HuddleTypes.IPeer[]>([]);
  const [consumerStreams, setConsumerStreams] = useState<IConsumerStreams>({
    video: [],
    audio: [],
    screen: [],
  });

  const meVideoElem = useRef<any>(null);
  const meScreenElem = useRef<any>(null);
  const joinRoomBtn = useRef<any>(null);
  // let window: any;

  let rAddress = "0x905040585A59C5B0E83Be2b247fC15a81FF4E533";
  let tokenAddress ='0x0000000000000000000000000000000000000000';



  const minABI = [
    {
     "constant": false,
     "inputs": [
      {
       "name": "_to",
       "type": "address"
      },
      {
       "name": "_value",
       "type": "uint256"
      }
     ],
     "name": "transfer",
     "outputs": [
      {
       "name": "",
       "type": "bool"
      }
     ],
     "type": "function"
    }
   ];
    
  
  let web3 = new Web3(window.ethereum);
  async function loadWeb3(){
    window.web3 = new Web3(window.ethereum);
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  
  let accounts = await web3.eth.getAccounts();
   console.log(accounts[0]);
   window.contract = await loadContract();
    
  }

  async function loadContract(){
    return  await new web3.eth.Contract(minABI as AbiItem[],tokenAddress);
    
   
  }

  async function getCurrentAccount(){
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    //console.log(account)
    return account;
  }
  
  async function transfer() {
   
    if (typeof window.ethereum !== 'undefined') {
     const account = await getCurrentAccount();
     const tr = await window.contract.methods.transfer(rAddress,10).send({from:account});
    }    
  }




  const getData = async () => {

      try {
        let result =await fetch('https://api.huddle01.com/',{
          method:'get',
          mode:'no-cors',
          headers:{
            'Accept':'application/json',
            'Content-type':'application/json',
            'x-api-key':'i4pzqbpxza8vpijQMwZsP1H7nZZEH0TN3vR4NdNS'
          },
         
        });

        console.log('result:' + result);
      }catch(e){
          console.log(e);
      }

  }



  //getData();

  
 const [locked,setLocked]=useState("pending");


  const  unlockHandler = (e: { detail: SetStateAction<string>; }) => {
    setLocked(e.detail);    
    
 }
 
  const checkout = () => {
    window.unlockProtocol && window.unlockProtocol.loadCheckoutModal();
 }
 


   useEffect(() => {
      
    window.addEventListener("unlockProtocol", unlockHandler as unknown as EventListener);
    return () => window.removeEventListener("unlockProtocol",unlockHandler as unknown as EventListener); 
   },[]);

   
  


  const config: HuddleTypes.HuddleClientConfig = {
    apiKey: "i4pzqbpxza8vpijQMwZsP1H7nZZEH0TN3vR4NdNS",
    roomId: "C132",
    peerId: "Rick" + Math.floor(Math.random() * 4000),
    displayName: "Rick Sanchez",
    window,
    isBot,
  };

  //initialize the app
  useEffect(() => {

      
   

    history.push(`?roomId=${config.roomId}`);

    const myHuddleClient: HuddleClient = new HuddleClient(config);
    setHuddle(myHuddleClient);

   
  }, []);

  
 
  

 
   

  //recording config
  useEffect(() => {
    //joinRoomBtn here can be whatever button/function used that calls `huddle.join()`
    huddle && isBot && joinRoomBtn.current.click();
  }, [huddle, isBot]);

  const setupEventListeners = async () => {
    emitter.on("roomState", (state: string) => {
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
          setRoomState(state);
          break;
      }
      setRoomState(state);
    });

    emitter.on("error", (error: any) => {
      alert(error);
      //do whatever
    });

    emitter.on("addPeer", (peer: HuddleTypes.IPeer) => {
      console.log("new peer =>", peer);
      setPeers((_peers) => [..._peers, peer]);
    });

    emitter.on("addProducer", (producer: HuddleTypes.IProducer) => {
      console.log("new prod", producer);
      switch (producer.type) {
        case "webcam":
          const videoStream: MediaStreamTrack | null = producer.track;
          if (typeof videoStream == "object") {
            try {
              if (videoStream !== null) {
                meVideoElem.current.srcObject = getTrack(videoStream);
              }
            } catch (error: any) {
              console.error(error);
            }
          }
          break;
        case "mic":
          //do whatever
          break;
        case "screen":
          const screenStream: MediaStreamTrack | null = producer.track;
          if (typeof screenStream == "object") {
            try {
              if (screenStream !== null) {
                meScreenElem.current.srcObject = getTrack(screenStream);
              }
            } catch (error: any) {
              console.error(error);
            }
          }
          break;

        default:
          break;
      }
    });

    emitter.on("removeProducer", (producer: HuddleTypes.IProducer) => {
      console.log("remove ", producer);
      switch (producer.type) {
        case "webcam":
          try {
            meVideoElem.current.srcObject = null;
          } catch (error: any) {
            console.error(error);
          }
          break;
        case "mic":
          //do whatever
          break;
        case "screen":
          try {
            meScreenElem.current.srcObject = null;
          } catch (error: any) {
            console.error(error);
          }
          break;

        default:
          break;
      }
    });

    emitter.on("addConsumer", (consumer: HuddleTypes.IConsumer) => {
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

    emitter.on("removeConsumer", (consumer: any) => {
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
    } catch (error: any) {
      alert(error);
    }
  };

  const leaveRoom = async () => {
    if (!huddle) return;
    try {
      await huddle.close();
      setRoomState("");
    } catch (error: any) {
      alert(error);
    }
  };

  //TODO: add pauseWebcam() and resumeWebcam()
  const enableWebcam = async () => {
    if (!huddle) return;
    try {
      await huddle.enableWebcam();
      setWebcamState(true);
    } catch (error: any) {
      setWebcamState(false);
      alert(error);
    }
  };

  const disableWebcam = async () => {
    if (!huddle) return;
    try {
      await huddle.disableWebcam();
      setWebcamState(false);
    } catch (error: any) {
      alert(error);
    }
  };

  const startScreenshare = async () => {
    if (!huddle) return;
    try {
      await huddle.enableShare();
      setScreenshareState(true);
    } catch (error: any) {
      alert(error);
      setScreenshareState(false);
    }
  };

  const stopScreenshare = async () => {
    if (!huddle) return;
    try {
      await huddle.disableShare();
      setScreenshareState(false);
    } catch (error: any) {
      alert(error);
    }
  };

  //TODO: add muteMic() and unmuteMic()
  const enableMic = async () => {
    if (!huddle) return;
    try {
      huddle.enableMic();
      setMicState(true);
    } catch (error: any) {
      setMicState(false);
      alert(error);
    }
  };

  const disableMic = async () => {
    if (!huddle) return;
    try {
      huddle.disableMic();
      setMicState(false);
    } catch (error: any) {
      alert(error);
      setMicState(true);
    }
  };

  const startRecording = async () => {
    if (!huddle) return;
    try {
      const status: boolean = await huddle.startRecording();
      if (status) console.log("recording successfully initiated");
    } catch (error: any) {
      console.error(error);
    }
  };

  const stopRecorder = async () => {
    if (!huddle) return;
    try {
      const status: boolean = await huddle.stopRecording();
      if (status) console.log("recording successfully stopped");
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <div className="App">
      <div>
        <header className="App-header">
          {locked === "locked" && (
            <div onClick={checkout} style={{ cursor: "pointer" }}>
              Unlock me!{" "}
              <span aria-label="locked" role="img">
                🔒
              </span>
            </div>
          )}
          {locked === "unlocked" && (
            <div>
              Unlocked!{" "}
              <span aria-label="unlocked" role="img">
                🗝
              </span>
            </div>
          )}
        </header> 
        
          
      </div>
      {locked === "unlocked" && (<><div className="me-ports">
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
        {<button onClick={getData}>GetData</button>}
        {<button onClick={loadWeb3}>Connect</button>}
        {<button onClick={transfer}>transfer</button>}
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
      </div></>)}
      
     
    </div>

  );
}

export default Room;


