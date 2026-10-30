import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Load dataset
DATASET_PATH = "ai/datasets/landmarks.csv"

df = pd.read_csv(DATASET_PATH)

# Separate features and labels
X = df.drop("label", axis=1)
y = df["label"]

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Create the model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Train the model
print("Training model...")
model.fit(X_train, y_train)

# Test the model
y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\nTraining completed.")
print(f"Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Save the trained model
MODEL_PATH = "ai/models/sign_language_model.pkl"

joblib.dump(model, MODEL_PATH)

print(f"\nModel saved to: {MODEL_PATH}")