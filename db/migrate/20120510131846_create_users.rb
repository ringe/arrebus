class CreateUsers < ActiveRecord::Migration
  def change
    create_table(:users) do |t|
      t.string :url
      t.integer :rebus_id
    end
  end
end
