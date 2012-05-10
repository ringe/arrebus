class CreatePointsUsers < ActiveRecord::Migration
  def change
    create_table(:points_users, :id => false) do |t|
      t.integer :user_id
      t.integer :point_id
    end
  end
end
