import { useEffect, useState } from "react"
import axios from "axios"

export default function QRDisplay() {
  const [qrCode, setQrCode] = useState(null)
  const [expiresIn, setExpiresIn] = useState(60)
  const [loading, setLoading] = useState(true)

  const fetchQR = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/qr/generate")
      setQrCode(response.data.qr_base64)
      setExpiresIn(response.data.expires_in)
      setLoading(false)
    } catch (error) {
      console.error("Error al obtener QR:", error)
    }
  }

  useEffect(() => {
    fetchQR()
    const interval = setInterval(fetchQR, 55000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div style={styles.container}><h2>Cargando QR...</h2></div>
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🏋️ GymSmart</h1>
      <h2 style={styles.subtitle}>Escanea para registrar tu asistencia</h2>
      <div style={styles.qrContainer}>
        <img src={qrCode} alt="QR de asistencia" style={styles.qrImage} />
      </div>
      <p style={styles.expiryText}>Este QR expira en: <strong>{expiresIn} segundos</strong></p>
      <p style={styles.infoText}>Abre la cámara de tu celular y escanea el código</p>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "Arial, sans-serif"
  },
  title: { color: "white", fontSize: "48px", marginBottom: "10px" },
  subtitle: { color: "white", fontSize: "24px", marginBottom: "30px" },
  qrContainer: { background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", marginBottom: "30px" },
  qrImage: { width: "300px", height: "300px", display: "block" },
  expiryText: { color: "white", fontSize: "18px", marginBottom: "10px" },
  infoText: { color: "white", fontSize: "16px", opacity: 0.9 }
}

