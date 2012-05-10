class CreatePoints < ActiveRecord::Migration
  def change
    create_table(:points) do |t|
      t.integer :order
      t.float :lng
      t.float :lat
      t.text :rebus
      t.string :image

      t.integer :rebus_id
    end
  end
end
