import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import {LogEntry, API_URL, refreshUser, fetchUserProfile} from '../api.js'
import { useState, useRef, useEffect } from 'react';
import Alert from 'react-bootstrap/Alert';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LogMood = () =>{

    const { user, setUser } = useContext(AuthContext);
    const [Wassup, setWassup] = useState('');
    const [Suggestion, setSuggestion] = useState('');
    const [Text, setText] = useState('');
    const navigate = useNavigate();
    const myElement = useRef(null);

    if (!user) {
        if (localStorage.getItem('token')){
            const getUser = async () => {
                const user = await fetchUserProfile(localStorage.getItem('token'));
                if (user){
                    setUser(user);
                };
            };
            getUser();
        } else {
            return <Navigate to="/login" replace={true} />;
        }
    }

    useEffect(() => {
        if (myElement.current) {
            if (Suggestion){
                myElement.current.innerHTML = Suggestion.suggestion
                myElement.current.style.display = "block";                
            }
        }
      }, [Suggestion]);


    const HandleEntry = async (e) => {
        if (Text){
            e.preventDefault();
            try{
                const response  = await LogEntry({'text':Text}, localStorage.getItem('token'))
                setText('');
                setSuggestion(response);
            } catch (err){
                if (localStorage.getItem('token')){
                    if (err.response.statusText=="Unauthorized"){
                        const tokendata = await refreshUser(localStorage.getItem("refresh"));
                        if (tokendata=="Refresh token expired"){
                            localStorage.removeItem('token');
                            localStorage.removeItem('refresh');
                            setUser(null);
                            navigate('/login', { replace: true, state: { message: 'Please log in again' } });

                        }else{
                            localStorage.setItem('token', tokendata.access);
                            const response = await axios.post(`${API_URL}/journal/add/`, {'text':Text}, {headers: {Authorization: `Bearer ${localStorage.getItem('token')}`}});
                            setText('');
                            setSuggestion(response.data);                        
                        }
                    };
                }else {
                    navigate('/login', { replace: true, state: { message: 'Please log in again' } });

                };
            };
        }
    };


    const myStrings = [
        "What’s going on in your world today? Anything exciting, new, or interesting that you’d love to share?",
        "What’s the latest vibe around you? Any cool stuff happening or just chilling through life like a boss?",
        "Sup! Any news, chaos, or random adventure going on in your corner of this wild, spinning planet?",
        "Tell me everything—life, friends, dreams, memes, weird moments—whatever’s on your mind, I’m ready!",
        "How’s it going? What mischief, magic, or mellow moods are happening in your world this fine day, my friend?",
        "What’s happening, superstar? Hit me with your current vibe, thoughts, or tales from today’s chapter of life.",
        "What’s up? Got any fun gossip, random thoughts, wild ideas, or deep questions bouncing around your head?",
        "Drop me a line—what’s new in your mind, heart, life, or even just your latest playlist?",
        "Is life chill or wild right now? Gimme the highlights, lowlights, or your latest food obsession.",
        "Spill the beans—anything cool, weird, hilarious, or totally random going on in your life today?",
        "What’s the tea? I’m all ears for your updates, secrets, rants, or those little daily joys.",
        "Wassup! Any cool plans, wild ideas, unexpected drama, or just cruising through life’s latest episode?",
        "How’s life treating you? Anything exciting, exhausting, enlightening, or emotional filling your day so far?",
        "Sup legend! Let me in on your latest moves—work wins, life fails, weekend plans, or snack discoveries.",
        "Howdy! Got any stories from today? Deep thoughts, silly memes, weird dreams, or just the joy of surviving?",
        "what’s the scoop? Anything weird, wonderful, or wildly unexpected that’s happened since we last connected?",
        "Is your day flowing with energy or crawling along? Either way, I want all the details.",
        "Wassup! Life throwing you curveballs or confetti lately? Either way, I’m here to hear it all—no filter."
    ];
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * myStrings.length);
        setWassup(myStrings[randomIndex]);
      }, []);

    return (
        <>
        <div id='logmood'>

            <div className="container pt-5" >
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6">
                        <div className="card shadow-sm rounded-300 pb-3" style={{backgroundColor: "#e8fff9"}}>
                            <div className="card-body">
                                <h1 className="card-title mb-4 text-center" style={{fontFamily:'system-ui'}}>Hey, {user && user.username}! &#128075;</h1>

                                    <div className="mb-3 py-2">
                                        <label htmlFor="question" className="form-label"><h6><i>{Wassup}</i></h6></label>
                                        <input type="text" value={Text} onChange={(e) => setText(e.target.value)} className="form-control"  id="question" placeholder="" required/>
                                    </div>

                                    <div className="d-grid">
                                        <button onClick={HandleEntry} type="submit" className="btn btn-primary btn-md rounded-pill">Post</button>
                                    </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container ">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6" style={{fontFamily:"mono"}}>
                        <img src='logo.png' width={120} height={120} style={{borderRadius:"20%", objectFit:"cover"}}/><br/>
                        <img src='ripples.svg' width={50} height={50}/>
                        <Alert ref={myElement} className='h4' variant="primary" style={{color:'black', backgroundColor: "#e7fffe", display:'none'}}>
                        </Alert>
                    </div>
                </div>
            </div>

        </div>
        </>
    );
}

export default LogMood;