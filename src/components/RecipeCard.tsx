
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Edit, Trash, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { db, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, getDoc } from "../lib/firebase";
import { toast } from "sonner";

export interface Recipe {
  recipe_id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  createdAt: {
    toDate: () => Date;
  };
  creatorId: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  isFavorite: boolean;
  updateFavorites: (recipeId: string, isFavorite: boolean) => void;
  refreshRecipes: () => void;
}

const RecipeCard = ({ recipe, isFavorite, updateFavorites, refreshRecipes }: RecipeCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleFavorite = async () => {
    try {
      if (!user) return;
      
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        toast.error("User data not found");
        return;
      }

      if (isFavorite) {
        await updateDoc(userRef, {
          favorites: arrayRemove(recipe.recipe_id)
        });
        updateFavorites(recipe.recipe_id, false);
        toast.success("Removed from Favorites", {
          action: {
            label: "View Favorites",
            onClick: () => navigate("/favorites")
          }
        });
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(recipe.recipe_id)
        });
        updateFavorites(recipe.recipe_id, true);
        toast.success("Added to Favorites", {
          action: {
            label: "View Favorites",
            onClick: () => navigate("/favorites")
          }
        });
      }

      // Update stats for favorites
      const statsRef = doc(db, "stats", "app_stats");
      await updateDoc(statsRef, {
        favoriteCount: increment(1)
      });
    } catch (error) {
      toast.error("Failed to update favorites");
      console.error("Error updating favorites:", error);
    }
  };

  const handleEdit = () => {
    navigate(`/edit-recipe/${recipe.recipe_id}`);
  };

  const handleDelete = async () => {
    try {
      if (confirm("Are you sure you want to delete this recipe?")) {
        await deleteDoc(doc(db, "recipes", recipe.recipe_id));
        toast.success("Recipe Deleted");
        refreshRecipes();
      }
    } catch (error) {
      toast.error("Failed to delete recipe");
      console.error("Error deleting recipe:", error);
    }
  };

  const isCreator = user && user.uid === recipe.creatorId;
  const formattedDate = recipe.createdAt ? new Date(recipe.createdAt.toDate()).toLocaleDateString() : "Unknown date";

  return (
    <div className="card h-full flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-semibold">{recipe.title}</h2>
        <button
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={toggleFavorite}
          className="focus:outline-none"
        >
          <Heart size={24} fill={isFavorite ? "#ef4444" : "none"} color={isFavorite ? "#ef4444" : "#71717a"} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 my-2">
        {recipe.tags.map((tag, index) => (
          <span key={index} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center">
            <Tag size={12} className="mr-1" />
            {tag}
          </span>
        ))}
      </div>

      <div className="mb-2">
        <p className="text-sm text-gray-500">Ingredients: {recipe.ingredients.length}</p>
        <p className="text-sm text-gray-500">Added: {formattedDate}</p>
      </div>

      {expanded && (
        <div className="mt-2">
          <h3 className="text-md font-medium">Ingredients:</h3>
          <ul className="list-disc pl-5 mb-2 text-sm">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>

          <h3 className="text-md font-medium">Steps:</h3>
          <ol className="list-decimal pl-5 text-sm">
            {recipe.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-2">
        <button
          className="text-sm text-gray-600 flex items-center"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp size={16} className="mr-1" /> Less
            </>
          ) : (
            <>
              <ChevronDown size={16} className="mr-1" /> More
            </>
          )}
        </button>

        {isCreator && (
          <div className="flex space-x-2">
            <button
              aria-label="Edit recipe"
              onClick={handleEdit}
              className="text-blue-500 hover:text-blue-700"
            >
              <Edit size={18} />
            </button>
            <button
              aria-label="Delete recipe"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
