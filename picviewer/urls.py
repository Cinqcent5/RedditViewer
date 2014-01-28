from django.conf.urls import patterns, url
from django.contrib import admin
from picviewer import views

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^r/(?P<subreddit>[A-z0-9\-_+]+)/(?P<order>hot|new|rising|controversial|top|)$', views.subredditSort, name='subredditSort'),
    url(r'^(?P<order>hot|new|rising|controversial|top|)$', views.sort, name='sort'),
    url(r'^r/(?P<subreddit>[A-z0-9\-_+]+)/search$', views.subredditSearch, name='subredditSearch'),
    url(r'^search$', views.default, name='search'),
    url(r'^r/(?P<subreddit>[A-z0-9\-_+]+)$', views.subreddit, name='subreddit'),   
    url(r'^u/(?P<user>[A-z0-9\-_+]+)/(?P<order>hot|new|controversial|top|)$', views.userSort, name='userSort'),
    url(r'^u/(?P<user>[A-z0-9\-_+]+)$', views.user, name='user'),
    url(r'^$', views.default, name='default'),
)
