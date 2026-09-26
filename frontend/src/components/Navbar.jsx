import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { navbarStyles } from "../assets/dummyStyles"
import img1 from '../assets/logo.png'

const Navbar = ({ user: propUser, onLogout }) => {
    const navigate = useNavigate();
    const menuRef = useRef();
    const [menuOpen, setMenuOpen] = useState(false);

    const user = propUser || {
        name: "",
        email: "",
    }

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    return (
        <header className={navbarStyles.header}>
            <div className={navbarStyles.container}>
                <div
                    onClick={() => navigate("/")}
                    className={navbarStyles.logoContainer}
                >
                    <div className={navbarStyles.logoImage}>
                        <img src={img1} alt="logo" />
                    </div>
                    <span className={navbarStyles.logoText}>Expense Tracker</span>
                </div>
                {user && (
                    <div className={navbarStyles.userContainer} ref={menuRef}>
                        <button onClick={toggleMenu} className={navbarStyles.userButton}>
                            <div className="relative">
                                <div className={navbarStyles.userAvatar}>
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className={navbarStyles.statusIndicator}>
                                </div>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Navbar