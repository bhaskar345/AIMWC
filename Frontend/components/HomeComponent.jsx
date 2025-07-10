import { Link } from 'react-router';
import Nav from 'react-bootstrap/Nav';
import Footer from './FooterComponent';

const Home = () => {

    return (
        <>
            <div className="container">
                <h1 className="display-4 py-4" style={{fontFamily:'mono'}}>Welcome to Your AI Mental Wellness Companion 🌿</h1>
            </div>

            <div className="container">
                <div className="row">
                    <div className="col-md-8 col-lg-8">
                        <h4 className='text-info text-start'><i>
                            <b>
                            Your safe, supportive space—designed to understand how you feel, offer gentle insights, and help you care for your mental well-being. Whether you're feeling up, down, or somewhere in between, I'm here to listen without judgment and guide you with science-backed tips, mood reflections, and calming support—anytime you need it.

                            Let’s take this journey together, one small, kind step at a time. 💙<br/><br/>
                            
                            Beyond conversations, the AI Mental Wellness Companion can track moods over time, helping users visualize their emotional patterns. This feature can be invaluable for individuals who struggle to recognize the subtle shifts in their mental state. Over time, the AI uses this data to provide gentle insights—for example, noting that someone tends to feel more anxious midweek or more relaxed after exercise—and offering tailored suggestions accordingly.<br/><br/>

                            Privacy and trust are central to the design of this companion. All user interactions are treated with utmost confidentiality, and no personal data is shared without explicit consent. The AI is trained to respond with sensitivity, avoiding judgment and always encouraging users to seek professional help when necessary.<br/><br/>
                            </b>  
                        </i></h4>
                        <div className="col-md-4 col-lg-4">
                            <Nav.Link as={Link} to="login" className='btn btn-info btn-md rounded text-light'>
                                <i class="fa-solid fa-right-from-bracket"></i>
                                Login to Continue
                            </Nav.Link>
                        </div>
                    </div>
                    <div className="col-md-4 col-lg-4">
                        <img width={'350px'} height={'350px'} src='logo.png'/>
                    </div>
                </div>
            </div>
            <Footer/>
        </>
    );
};

export default Home;