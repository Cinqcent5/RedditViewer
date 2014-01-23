from django.conf.urls import patterns, url
from django.contrib import admin
from picviewer import views

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^', views.index),
)
