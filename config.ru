require 'sinatra'
require 'sinatra/base'
require 'sinatra/assetpack'
require 'sinatra/activerecord'
require './app'

set :env, ENV['RACK_ENV']
disable :run

run App
