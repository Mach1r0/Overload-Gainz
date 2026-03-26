from rest_framework import viewsets, permissions

from core.mixins import OwnedByUserMixin
from .models import PersonalRecord, BodyMeasurement, ProgressPhoto
from .serializers import PersonalRecordSerializer, BodyMeasurementSerializer, ProgressPhotoSerializer


class PersonalRecordViewSet(OwnedByUserMixin, viewsets.ModelViewSet):
    queryset = PersonalRecord.objects.all()
    serializer_class = PersonalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]


class BodyMeasurementViewSet(OwnedByUserMixin, viewsets.ModelViewSet):
    queryset = BodyMeasurement.objects.all()
    serializer_class = BodyMeasurementSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProgressPhotoViewSet(OwnedByUserMixin, viewsets.ModelViewSet):
    queryset = ProgressPhoto.objects.all()
    serializer_class = ProgressPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]
