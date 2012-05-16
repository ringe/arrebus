require 'sinatra'
require './app'

set :env, ENV['RACK_ENV']
disable :run

run App
