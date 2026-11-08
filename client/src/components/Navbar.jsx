import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const link = "text-white/80 hover:text-white";

  return (
    <header className="bg-blue-600 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
          <span className="rounded bg-signal px-2 py-0.5 text-blue-600">VR</span>
          Vehicle Rental
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium">
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link to="/admin" className="font-bold text-signal hover:underline">
                  Admin
                </Link>
              )}
              <Link to="/bookings" className={link}>
                My bookings
              </Link>
              <span className="hidden text-white/60 sm:inline">{user.name}</span>
              <button
                onClick={handleLogout}
                className="rounded border border-white/40 px-3 py-1.5 hover:bg-white/10"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={link}>
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded bg-signal px-4 py-1.5 font-bold text-blue-600 hover:brightness-95"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
