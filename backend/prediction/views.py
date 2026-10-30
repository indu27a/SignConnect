import joblib
import numpy as np

from pathlib import Path
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


MODEL_PATH = (
    Path(settings.BASE_DIR)
    / "ai"
    / "models"
    / "sign_language_model.pkl"
)

model = None


def load_model():
    global model

    if model is None:
        model = joblib.load(MODEL_PATH)

    return model


@api_view(["GET", "POST"])
def predict_sign(request):

    if request.method == "GET":
        return Response({
            "message": "SignConnect Prediction API is running",
            "supported_signs": ["A", "B", "C"],
            "required_features": 63
        })

    features = request.data.get("features")

    if not isinstance(features, list) or len(features) != 63:
        return Response(
            {"error": "Exactly 63 landmark values are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        features = np.asarray(features, dtype=float)

        if not np.isfinite(features).all():
            raise ValueError("Invalid feature values")

        features = features.reshape(1, 63)

        trained_model = load_model()

        prediction = trained_model.predict(features)[0]

        probabilities = trained_model.predict_proba(features)[0]

        confidence = float(np.max(probabilities)) * 100

        return Response({
            "prediction": str(prediction),
            "confidence": round(confidence, 2)
        })

    except (ValueError, TypeError):
        return Response(
            {"error": "Invalid landmark values"},
            status=status.HTTP_400_BAD_REQUEST
        )

    except FileNotFoundError:
        return Response(
            {"error": "Trained model file not found"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )