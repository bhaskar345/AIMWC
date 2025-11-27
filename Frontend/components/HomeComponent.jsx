import { Link } from 'react-router';
import Nav from 'react-bootstrap/Nav';

const Home = () => {
    return (
        <div className="min-vh-100 d-flex flex-column" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated background elements */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0.1,
                background: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)'
            }}></div>

            {/* Main content */}
            <div className="container flex-grow-1 position-relative" style={{ zIndex: 1 }}>
                <div className="row min-vh-100 align-items-center py-5">
                    <div className="col-lg-6 mb-5 mb-lg-0">
                        {/* Hero text */}
                        <div className="text-white" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
                            <div className="mb-4">
                                <span className="badge px-3 py-2 mb-3" style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    borderRadius: '50px'
                                }}>
                                    🌿 Your Personal Wellness Journey
                                </span>
                            </div>
                            
                            <h1 className="display-3 fw-bold mb-4" style={{
                                lineHeight: '1.2',
                                letterSpacing: '-0.02em'
                            }}>
                                Welcome to Your AI Mental Wellness Companion
                            </h1>
                            
                            <p className="lead mb-4" style={{
                                fontSize: '1.25rem',
                                lineHeight: '1.8',
                                opacity: 0.95
                            }}>
                                Your safe, supportive space—designed to understand how you feel, offer gentle insights, 
                                and help you care for your mental well-being.
                            </p>

                            {/* Feature cards */}
                            <div className="row g-3 mb-4">
                                {[
                                    { icon: '💙', title: 'Non-Judgmental', text: 'A safe space to express yourself' },
                                    { icon: '📊', title: 'Track Moods', text: 'Visualize your emotional patterns' },
                                    { icon: '🔒', title: 'Private', text: 'Your data stays confidential' }
                                ].map((feature, idx) => (
                                    <div key={idx} className="col-md-4">
                                        <div className="p-3 rounded" style={{
                                            background: 'rgba(255, 255, 255, 0.15)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            transition: 'transform 0.3s ease',
                                            cursor: 'default'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                            <div className="fs-4 mb-2">{feature.icon}</div>
                                            <div className="fw-semibold small">{feature.title}</div>
                                            <div className="small" style={{ opacity: 0.9 }}>{feature.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <Nav.Link as={Link} to="login" className="btn btn-lg px-5 py-3 fw-semibold d-inline-flex align-items-center gap-2" style={{
                                background: 'white',
                                color: '#667eea',
                                border: 'none',
                                borderRadius: '50px',
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                transition: 'all 0.3s ease',
                                textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                            }}>
                                Start Your Journey
                                <i className="fa-solid fa-arrow-right"></i>
                            </Nav.Link>
                        </div>
                    </div>

                    {/* Image/illustration side */}
                    <div className="col-lg-4">
                        <div className="position-relative" style={{ animation: 'float 6s ease-in-out infinite' }}>
                            <div className="rounded-4 p-4" style={{
                                background: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                            }}>
                                <img 
                                    src='logo.png' 
                                    alt="Mental Wellness Companion"
                                    className="img-fluid rounded-3"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                            
                            {/* Floating elements */}
                            <div className="position-absolute" style={{
                                top: '-20px',
                                right: '-20px',
                                width: '80px',
                                height: '80px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '20px',
                                animation: 'float 4s ease-in-out infinite',
                                animationDelay: '1s'
                            }}></div>
                            
                            <div className="position-absolute" style={{
                                bottom: '-30px',
                                left: '-30px',
                                width: '100px',
                                height: '100px',
                                background: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '25px',
                                animation: 'float 5s ease-in-out infinite',
                                animationDelay: '0.5s'
                            }}></div>
                        </div>
                    </div>
                </div>

                {/* Info section */}
                <div className="row pb-5">
                    <div className="col-12">
                        <div className="p-5 rounded-4" style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <h2 className="text-white mb-4 fw-bold">How It Works</h2>
                            <div className="row g-4 text-white">
                                <div className="col-md-4">
                                    <div className="d-flex gap-3">
                                        <div className="fs-1">📝</div>
                                        <div>
                                            <h5 className="fw-semibold mb-2">Express Yourself</h5>
                                            <p className="small" style={{ opacity: 0.9 }}>
                                                Share your thoughts and feelings in a judgment-free space. The AI listens and understands with empathy.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex gap-3">
                                        <div className="fs-1">📈</div>
                                        <div>
                                            <h5 className="fw-semibold mb-2">Track Progress</h5>
                                            <p className="small" style={{ opacity: 0.9 }}>
                                                Monitor your moods over time and discover patterns that help you understand yourself better.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex gap-3">
                                        <div className="fs-1">✨</div>
                                        <div>
                                            <h5 className="fw-semibold mb-2">Get Support</h5>
                                            <p className="small" style={{ opacity: 0.9 }}>
                                                Receive science-backed tips and gentle guidance tailored to your unique journey.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-white text-center py-4 position-relative" style={{
                zIndex: 1,
                background: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <p className="mb-0 small">&copy; 2025 Bhaskar Singh Chauhan. All rights reserved.</p>
            </footer>

            {/* CSS animations */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
            `}</style>
        </div>
    );
};

export default Home;