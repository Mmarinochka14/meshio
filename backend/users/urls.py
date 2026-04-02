from django.urls import path

from .views import (
    AdminAllUsersView,
    AdminSellerRequestsView,
    ApproveSellerView,
    DeleteSellerAvatarView,
    DeleteSellerProfileView,
    DeleteUserAvatarView,
    LoginView,
    MySellerProfileView,
    ProfileView,
    PublicSellerProfileView,
    RegisterView,
    RejectSellerView,
    SellerProductsView,
    UploadSellerAvatarView,
    UploadUserAvatarView,
ChangePasswordView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', ProfileView.as_view(), name='profile'),
    path('me/upload-avatar/', UploadUserAvatarView.as_view(), name='upload-user-avatar'),
    path('me/delete-avatar/', DeleteUserAvatarView.as_view(), name='delete-user-avatar'),

    path('seller/me/', MySellerProfileView.as_view(), name='my-seller-profile'),
    path('seller/me/upload-avatar/', UploadSellerAvatarView.as_view(), name='upload-seller-avatar'),
    path('seller/me/delete-avatar/', DeleteSellerAvatarView.as_view(), name='delete-seller-avatar'),
    path('seller/me/delete-profile/', DeleteSellerProfileView.as_view(), name='delete-seller-profile'),
    path('seller/<int:pk>/', PublicSellerProfileView.as_view(), name='public-seller-profile'),
    path('seller/<int:pk>/products/', SellerProductsView.as_view(), name='seller-products'),

    path('admin/all/', AdminAllUsersView.as_view(), name='admin-all-users'),
    path('admin/seller-requests/', AdminSellerRequestsView.as_view(), name='admin-seller-requests'),
    path('<int:pk>/approve-seller/', ApproveSellerView.as_view(), name='approve-seller'),
    path('<int:pk>/reject-seller/', RejectSellerView.as_view(), name='reject-seller'),
path("me/change-password/", ChangePasswordView.as_view(), name="change-password"),
]