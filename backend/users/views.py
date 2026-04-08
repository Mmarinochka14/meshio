from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import Http404

from core.object_storage import delete_file_from_storage, upload_file_to_storage
from .models import SellerProfile, User
from .permissions import IsAdminRole, IsApprovedSeller
from .serializers import (
    AdminUserSerializer,
    SellerModerationSerializer,
    SellerProfileCreateUpdateSerializer,
    SellerProfileSerializer,
    SellerAvatarUploadSerializer,
    UserProfileUpdateSerializer,
    UserAvatarUploadSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegisterSerializer,
ChangePasswordSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'token': token.key,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'token': token.key,
            },
            status=status.HTTP_200_OK,
        )


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            UserProfileSerializer(request.user, context={'request': request}).data,
            status=status.HTTP_200_OK
        )

class UploadUserAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = UserAvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        old_storage_path = request.user.avatar_storage_path

        try:
            upload_result = upload_file_to_storage(
                uploaded_file,
                folder=f'users/{request.user.id}/avatar'
            )
        except Exception as e:
            return Response(
                {'detail': f'Ошибка загрузки аватара: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        request.user.avatar_storage_path = upload_result['storage_path']
        request.user.save(update_fields=['avatar_storage_path'])

        try:
            if old_storage_path:
                (delete_file_from_storage
                 (old_storage_path))
        except Exception:
            pass

        if request.user.avatar:
            request.user.avatar.delete(save=False)

        return Response(
            {
                'detail': 'Аватар загружен.',
                'avatar_storage_path': request.user.avatar_storage_path,
                'profile': UserProfileSerializer(request.user, context={'request': request}).data,
            },
            status=status.HTTP_200_OK
        )

class DeleteUserAvatarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        old_storage_path = request.user.avatar_storage_path

        try:
            if old_storage_path:
                delete_file_from_storage(old_storage_path)
        except Exception:
            pass

        if request.user.avatar:
            request.user.avatar.delete(save=False)

        request.user.avatar_storage_path = None
        request.user.save(update_fields=['avatar_storage_path'])

        return Response(
            {
                'detail': 'Аватар пользователя удалён.',
                'profile': UserProfileSerializer(request.user, context={'request': request}).data,
            },
            status=status.HTTP_200_OK
        )

class UploadSellerAvatarView(APIView):
    permission_classes = [IsApprovedSeller]

    def post(self, request):
        profile = SellerProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response(
                {'detail': 'Сначала создайте профиль магазина.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SellerAvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        old_storage_path = profile.store_avatar_storage_path

        try:
            upload_result = upload_file_to_storage(
                uploaded_file,
                folder=f'stores/{request.user.id}/avatar'
            )
        except Exception as e:
            return Response(
                {'detail': f'Ошибка загрузки аватара магазина: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        profile.store_avatar_storage_path = upload_result['storage_path']
        profile.save(update_fields=['store_avatar_storage_path'])

        try:
            if old_storage_path:
                delete_file_from_storage(old_storage_path)
        except Exception:
            pass

        if profile.store_avatar:
            profile.store_avatar.delete(save=False)

        return Response(
            {
                'detail': 'Аватар магазина загружен.',
                'store_avatar_storage_path': profile.store_avatar_storage_path,
                'seller_profile': SellerProfileSerializer(profile, context={'request': request}).data,
            },
            status=status.HTTP_200_OK
        )

class DeleteSellerAvatarView(APIView):
    permission_classes = [IsApprovedSeller]

    def delete(self, request):
        profile = SellerProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response(
                {'detail': 'Профиль магазина не найден.'},
                status=status.HTTP_404_NOT_FOUND
            )

        old_storage_path = profile.store_avatar_storage_path

        try:
            if old_storage_path:
                delete_file_from_storage(old_storage_path)
        except Exception:
            pass

        if profile.store_avatar:
            profile.store_avatar.delete(save=False)

        profile.store_avatar_storage_path = None
        profile.save(update_fields=['store_avatar_storage_path'])

        return Response(
            {
                'detail': 'Аватар магазина удалён.',
                'seller_profile': SellerProfileSerializer(profile, context={'request': request}).data,
            },
            status=status.HTTP_200_OK
        )

class DeleteSellerProfileView(APIView):
    permission_classes = [IsApprovedSeller]

    def delete(self, request):
        profile = SellerProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response(
                {'detail': 'Профиль магазина не найден.'},
                status=status.HTTP_404_NOT_FOUND
            )

        old_storage_path = profile.store_avatar_storage_path

        try:
            if old_storage_path:
                delete_file_from_storage(old_storage_path)
        except Exception:
            pass

        if profile.store_avatar:
            profile.store_avatar.delete(save=False)

        profile.delete()

        return Response(
            {'detail': 'Профиль магазина удалён.'},
            status=status.HTTP_200_OK
        )

class MySellerProfileView(APIView):
    permission_classes = [IsApprovedSeller]

    def get(self, request):
        profile = SellerProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response(
                {'detail': 'Профиль магазина ещё не создан.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(SellerProfileSerializer(profile, context={'request': request}).data)

    def post(self, request):
        profile = SellerProfile.objects.filter(user=request.user).first()
        if profile:
            return Response(
                {'detail': 'Профиль магазина уже существует.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SellerProfileCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user)

        return Response(
            SellerProfileSerializer(profile, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def patch(self, request):
        profile = SellerProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response(
                {'detail': 'Сначала создайте профиль магазина.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SellerProfileCreateUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            SellerProfileSerializer(profile, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class PublicSellerProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            seller = User.objects.get(
                id=pk,
                role='seller',
                seller_status='approved'
            )
        except User.DoesNotExist:
            return Response(
                {'detail': 'Продавец не найден или не одобрен.'},
                status=status.HTTP_404_NOT_FOUND
            )

        profile = SellerProfile.objects.filter(user=seller).first()
        if not profile:
            return Response(
                {'detail': 'Профиль магазина не найден.'},
                status=status.HTTP_404_NOT_FOUND
            )

        products = seller.products.filter(status='published').select_related(
            'seller',
            'category',
            'license',
        )

        total_products = products.count()
        average_rating = round(
            sum(product.average_rating for product in products) / total_products, 2
        ) if total_products > 0 else 0

        return Response(
            {
                'seller': SellerProfileSerializer(profile, context={'request': request}).data,
                'stats': {
                    'total_products': total_products,
                    'average_rating': average_rating,
                },
            },
            status=status.HTTP_200_OK
        )


class SellerProductsView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        try:
            seller = User.objects.get(
                id=self.kwargs['pk'],
                role='seller',
                seller_status='approved'
            )
        except User.DoesNotExist:
            raise Http404('Продавец не найден или не одобрен.')

        return seller.products.filter(status='published').select_related(
            'seller',
            'category',
            'license',
        )

    def get_serializer_class(self):
        from products.serializers import ProductListSerializer
        return ProductListSerializer


class AdminAllUsersView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')


class AdminSellerRequestsView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(
            role='seller',
            seller_status='pending'
        ).order_by('date_joined')


class ApproveSellerView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            user = User.objects.get(id=pk, role='seller')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Продавец не найден.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SellerModerationSerializer(
            user,
            data={'seller_status': 'approved'},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                'detail': 'Продавец одобрен.',
                'user': AdminUserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class RejectSellerView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        try:
            user = User.objects.get(id=pk, role='seller')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Продавец не найден.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SellerModerationSerializer(
            user,
            data={'seller_status': 'rejected'},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                'detail': 'Заявка продавца отклонена.',
                'user': AdminUserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()

        return Response(
            {"detail": "Пароль обновлён."},
            status=status.HTTP_200_OK
        )