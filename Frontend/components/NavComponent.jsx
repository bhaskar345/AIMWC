import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from 'react-router';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useContext } from 'react';



function SiteNavbar() {

    const { user, logout } = useContext(AuthContext);

    return (
		<>
            <Navbar bg="light" data-bs-theme="light">
            <Navbar.Brand as={Link} to="/">
                <img src='logo.png' width={40} height={40} style={{borderRadius:"20%", objectFit:"cover"}}/>
            </Navbar.Brand>
            <Nav className="me-auto">
                {user ? (
                    <>
                    <i className="fa-solid fa-chart-simple"></i>
                    <Nav.Link as={Link} to="stats"  style={{color:'black'}}>Stats</Nav.Link>

                    <Nav.Link as={Link} to="chat" className='btn btn-light btn-sm rounded text-info' style={{color:"black", fontFamily:'mono'}}>
                        <i className="fa-solid fa-robot"></i>
                        <b>AI</b>
                    </Nav.Link>

                    <button type="button" onClick={logout} className="btn btn-danger btn-sm rounded">
                        <i className="fa-solid fa-arrow-left"></i>
                        Logout
                    </button>
                    </>
                ):(
                    <>
                    <Nav.Link as={Link} to="login" className='btn btn-primary btn-sm rounded text-light'>
                        <i className="fa-solid fa-right-from-bracket"></i>
                        Login
                    </Nav.Link>
                    <Nav.Link as={Link} to="register" className='btn btn-success btn-sm rounded text-light'>
                        <i className="fa-solid fa-user-plus"></i>
                        Signup
                        </Nav.Link>
                    </>
                )}
            </Nav>
            </Navbar>
        </>
    )
}

export default SiteNavbar;