import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import axios from "axios"
import { supabase } from "../lib/supabaseClient"

export default function ScanQR() {
  const [scanResult, setScanResult] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [user, setUser] = useState(null)
  const [cameraActive, setCameraActive] = useState(true)
  const scannerRef = useRef(null)
  const containerId = "qr-reader-container"

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login"
      } else {
        setUser(data.user)
      }
    })
  }, [])

  const startScanner = async () => {
    if (!user) return
    
    const config = {
      fps: 10,
      qrbox: { width: 300, height: 300 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      rememberLastUsedCamera: true
    }

    const html5QrCode = new Html5Qrcode(containerId)
    scannerRef.current = html5QrCode

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
      )
      setCameraActive(true)
    } catch (err) {
      console.error("Error con cámara trasera:", err)
      try {
        await html5QrCode.start(
          { facingMode: "user" },
          config,
          onScanSuccess,
          onScanError
        )
        setCameraActive(true)
      } catch (err2) {
        console.error("Error con cámara frontal:", err2)
        setScanResult({ success: false, message: "❌ No se pudo acceder a la cámara" })
      }
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.warn("Error al detener escáner:", err)
      }
      scannerRef.current = null
    }
    setCameraActive(false)
  }

  const onScanSuccess = async (decodedText) => {
    if (verifying) return
    
    setVerifying(true)
    await stopScanner()
    
    try {
      const response = await axios.post("http://localhost:8000/api/attendance/scan-checkin", {
        token: decodedText,
        user_id: user.id
      })
      
      if (response.data.valid) {
        setScanResult({ success: true, message: "✅ " + response.data.message })
      } else {
        setScanResult({ success: false, message: "❌ " + response.data.message })
      }
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || "Error al verificar QR"
      setScanResult({ success: false, message: "❌ " + msg })
    }
    
    setVerifying(false)
  }

  const onScanError = (error) => {
    console.warn("Error de escaneo:", error)
  }

  const reiniciarEscanner = async () => {
    setScanResult(null)
    setVerifying(false)
    await startScanner()
  }

  useEffect(() => {
    if (user) {
      startScanner()
    }
    return () => {
      stopScanner()
    }
  }, [user])

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📷 Escanear QR</h1>
        <button onClick={() => window.location.href = "/dashboard/user"} style={styles.backButton}>
          ← Volver
        </button>
      </div>
      
      <div style={styles.scannerContainer}>
        <div id={containerId} style={styles.scanner}></div>
        {!cameraActive && !scanResult && (
          <div style={styles.cameraOff}>
            <p>📷 Cámara apagada</p>
            <button onClick={reiniciarEscanner} style={styles.retryButton}>Activar cámara</button>
          </div>
        )}
      </div>
      
      {verifying && (
        <div style={styles.loading}>
          <p>🔍 Verificando código...</p>
        </div>
      )}
      
      {scanResult && (
        <div style={{
          ...styles.result,
          background: scanResult.success ? "#d4edda" : "#f8d7da",
          color: scanResult.success ? "#155724" : "#721c24"
        }}>
          <p>{scanResult.message}</p>
          <button onClick={reiniciarEscanner} style={styles.retryButton}>
            📷 Escanear otro QR
          </button>
        </div>
      )}
      
      <div style={styles.instructions}>
        <h3>📌 Instrucciones:</h3>
        <p>1. Apunta tu cámara al código QR en la pantalla de recepción</p>
        <p>2. Asegúrate de tener buena iluminación</p>
        <p>3. El QR se actualiza cada 60 segundos</p>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: "650px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" },
  backButton: { padding: "10px 20px", background: "#6c757d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  scannerContainer: { background: "#000", borderRadius: "10px", overflow: "hidden", marginBottom: "20px", minHeight: "400px", position: "relative" },
  scanner: { width: "100%" },
  cameraOff: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", color: "white" },
  loading: { textAlign: "center", padding: "15px", background: "#fff3cd", borderRadius: "5px", marginBottom: "20px" },
  result: { textAlign: "center", padding: "15px", borderRadius: "5px", marginBottom: "20px", fontWeight: "bold" },
  retryButton: { marginTop: "10px", padding: "8px 16px", background: "#0070f3", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  instructions: { background: "#e9ecef", padding: "15px", borderRadius: "10px", marginTop: "20px" }
}
