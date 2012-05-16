require 'sinatra'
require './app'

set :env, (ENV['RACK_ENV']).to_sym
disable :run

run App
