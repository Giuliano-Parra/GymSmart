import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

print("Entrenando modelo Random Forest...")

# Datos sintéticos
data = pd.DataFrame({
    'asistencia_semanal': [5,4,3,2,1,0,5,4,3,2,1,0,5,4,3],
    'dias_inactivo': [0,2,5,10,15,30,1,3,7,12,18,25,2,4,6],
    'antiguedad_meses': [1,3,6,12,18,24,2,5,10,15,20,22,4,7,9],
    'plan_premium': [1,1,0,0,1,0,1,1,0,0,1,0,1,1,0],
    'abandono': [0,0,0,1,1,1,0,0,1,1,1,1,0,0,0]
})

X = data.drop('abandono', axis=1)
y = data['abandono']

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/churn_model.pkl')

print(f"Modelo guardado en models/churn_model.pkl")
print(f"Precisión en entrenamiento: {model.score(X, y) * 100:.2f}%")
