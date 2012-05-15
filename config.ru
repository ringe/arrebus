require 'sinatra'

set :env,  :production
disable :run

require './app.rb'

run App

