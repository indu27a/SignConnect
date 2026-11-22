from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "password",
        )

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            raise serializers.ValidationError(
                "Invalid username or password."
            )

        attrs["user"] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "date_of_birth",
            "preferred_language",
            "profile_picture",
            "bio",
            "translation_count",
            "is_verified",
            "created_at",
        )

        read_only_fields = (
            "id",
            "username",
            "translation_count",
            "is_verified",
            "created_at",
        )
class UserDiscoverySerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "profile_picture",
            "bio",
            "preferred_language",
            "is_verified",
        )

        read_only_fields = fields