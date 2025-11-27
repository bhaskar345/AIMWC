import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useContext } from 'react';

function SiteNavbar() {
    const { user, logout } = useContext(AuthContext);

    return (
        <>
            <Navbar 
                expand="lg" 
                className="px-4 py-3 shadow-sm"
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000
                }}
            >
                <div className="container-fluid">
                    {/* Brand/Logo */}
                    <Navbar.Brand 
                        as={Link} 
                        to="/" 
                        className="d-flex align-items-center gap-2"
                        style={{ 
                            transition: 'transform 0.3s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img 
                                src='logo.png' 
                                width={45} 
                                height={45} 
                                alt="Logo"
                                style={{
                                    objectFit: 'cover',
                                    width: '100%',
                                    height: '100%'
                                }}
                            />
                        </div>
                        <span className="fw-bold d-none d-md-inline" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '1.1rem'
                        }}>
                            Wellness AI
                        </span>
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ms-auto d-flex align-items-center gap-2">
                            {user ? (
                                <>
                                    {/* Stats Link */}
                                    <Nav.Link 
                                        as={Link} 
                                        to="stats"
                                        className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                                        style={{
                                            color: '#667eea',
                                            fontWeight: '500',
                                            transition: 'all 0.3s ease',
                                            border: '1px solid transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                    >
                                        <i className="fa-solid fa-chart-simple"></i>
                                        <span>Stats</span>
                                    </Nav.Link>

                                    {/* AI Chat Button */}
                                    <Nav.Link 
                                        as={Link} 
                                        to="chat"
                                        className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold"
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                            transition: 'all 0.3s ease',
                                            textDecoration: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                        }}
                                    >
                                        <i className="fa-solid fa-robot"></i>
                                        <span>AI Chat</span>
                                    </Nav.Link>

                                    {/* Logout Button */}
                                    <button 
                                        type="button" 
                                        onClick={logout}
                                        className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold border-0"
                                        style={{
                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            color: 'white',
                                            boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 87, 108, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 87, 108, 0.3)';
                                        }}
                                    >
                                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Login Button */}
                                    <Nav.Link 
                                        as={Link} 
                                        to="login"
                                        className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold"
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                            transition: 'all 0.3s ease',
                                            textDecoration: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                        }}
                                    >
                                        <i className="fa-solid fa-right-to-bracket"></i>
                                        <span>Login</span>
                                    </Nav.Link>

                                    {/* Signup Button */}
                                    <Nav.Link 
                                        as={Link} 
                                        to="register"
                                        className="d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold"
                                        style={{
                                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
                                            transition: 'all 0.3s ease',
                                            textDecoration: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 172, 254, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 172, 254, 0.4)';
                                        }}
                                    >
                                        <i className="fa-solid fa-user-plus"></i>
                                        <span>Sign Up</span>
                                    </Nav.Link>
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </div>
            </Navbar>
        </>
    );
}

export default SiteNavbar;