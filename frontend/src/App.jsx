import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./pages/user/Home"
import Login from "./pages/user/Login"
import Register from "./pages/user/Register"
import EditProfile from "./pages/user/EditProfile"
import ScrollToTop from "./components/ScrollToTop"

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow py-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/edit-profile" element={<EditProfile />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  )
}
