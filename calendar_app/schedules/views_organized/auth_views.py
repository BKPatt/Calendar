import base64
import uuid
import logging
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.conf import settings
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import authenticate
from ..models import CustomUser, UserProfile
from ..serializers import UserSerializer

logger = logging.getLogger(__name__)

def decrypt_password(encrypted_password):
    try:
        logger.info("Starting password decryption.")
        print("AES Encryption Key: " + settings.AES_ENCRYPTION_KEY)
        print("AES IV: " + settings.AES_IV)
        key = settings.AES_ENCRYPTION_KEY[:32].encode('utf-8')
        iv = settings.AES_IV[:16].encode('utf-8')
        encrypted_password_bytes = base64.b64decode(encrypted_password)
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted_password = unpad(cipher.decrypt(encrypted_password_bytes), AES.block_size)
        logger.info("Password decryption successful.")
        return decrypted_password.decode('utf-8')
    except Exception as e:
        logger.error(f"Password decryption failed: {str(e)}")
        raise

class AuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        encrypted_password = request.data.get('password')

        try:
            logger.info(f"Attempting to authenticate user {username}.")
            password = decrypt_password(encrypted_password)
        except Exception as e:
            logger.error(f"Decryption error for user {username}: {str(e)}")
            return Response({'error': 'Invalid encrypted password'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            response_data = {
                'user': UserSerializer(user).data,
                'access_token': access_token,
                'refresh_token': str(refresh),
            }
            logger.info(f"User {username} authenticated successfully.")
            return Response(response_data, status=status.HTTP_200_OK)

        logger.warning(f"Invalid credentials for user {username}.")
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        encrypted_password = request.data.get('password')

        try:
            logger.info(f"Registration attempt for user {request.data.get('username')}.")
            decrypted_password = decrypt_password(encrypted_password)
        except Exception as e:
            logger.error(f"Decryption error during registration: {str(e)}")
            return Response({'error': 'Invalid encrypted password'}, status=status.HTTP_400_BAD_REQUEST)

        request.data['password'] = decrypted_password
        serializer = UserSerializer(data=request.data)

        if serializer.is_valid():
            try:
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)

                response_data = {
                    'user': UserSerializer(user).data,
                    'access_token': access_token,
                    'refresh_token': str(refresh)
                }
                logger.info(f"User {request.data.get('username')} registered successfully.")
                return Response(response_data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Error saving user {request.data.get('username')}: {str(e)}")
                return Response({'error': 'User registration failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            logger.warning(f"Invalid registration data for user {request.data.get('username')}: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        encrypted_password = request.data.get('password')

        try:
            logger.info(f"Login attempt for user {username}.")
            password = decrypt_password(encrypted_password)
        except Exception as e:
            logger.error(f"Decryption error during login for user {username}: {str(e)}")
            return Response({'error': 'Invalid encrypted password'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            response_data = {
                'user': UserSerializer(user).data,
                'access_token': access_token,
                'refresh_token': str(refresh),
            }
            logger.info(f"Login successful for user {username}.")
            return Response(response_data, status=status.HTTP_200_OK)

        logger.warning(f"Login failed for user {username}: Invalid credentials.")
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = request.auth
        if token:
            try:
                token.delete()
                logger.info(f"User {request.user.username} logged out successfully.")
                return Response({"status": "Successfully logged out"}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Error logging out user {request.user.username}: {str(e)}")
                return Response({"error": "Logout failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"error": "Invalid token or already logged out"}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    def post(self, request):
        email = request.data.get('email')
        try:
            user = get_object_or_404(CustomUser, email=email)
            reset_token = uuid.uuid4()
            user.profile.reset_token = reset_token
            user.profile.save()
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
            send_mail(
                'Password Reset',
                f'Click this link to reset your password: {reset_link}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            logger.info(f"Password reset email sent to {email}.")
            return Response({'message': 'Password reset email sent'})
        except Exception as e:
            logger.error(f"Error resetting password for {email}: {str(e)}")
            return Response({'error': 'Failed to reset password'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailVerificationView(APIView):
    def get(self, request, verification_token):
        try:
            profile = UserProfile.objects.get(verification_token=verification_token)
            profile.email_verified = True
            profile.verification_token = None
            profile.save()
            logger.info(f"Email verified for user {profile.user.username}.")
            return Response({'status': 'Email verified successfully'}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            logger.warning(f"Invalid email verification token: {verification_token}.")
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def verify_token(request):
    return Response({'valid': True}, status=status.HTTP_200_OK)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)