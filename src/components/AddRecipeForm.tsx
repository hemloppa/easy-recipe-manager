
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { db, collection, doc, setDoc, Timestamp } from "../lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface AddRecipeFormProps {
  initialRecipe?: {
    recipe_id: string;
    title: string;
    ingredients: string[];
    steps: string[];
    tags: string[];
  };
  isEditing?: boolean;
}

const AddRecipeForm = ({ initialRecipe, isEditing = false }: AddRecipeFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState(initialRecipe?.title || "");
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>(initialRecipe?.ingredients || []);
  const [stepInput, setStepInput] = useState("");
  const [steps, setSteps] = useState<string[]>(initialRecipe?.steps || []);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialRecipe?.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addIngredient = () => {
    if (!ingredientInput.trim()) return;
    setIngredients([...ingredients, ingredientInput.trim()]);
    setIngredientInput("");
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addStep = () => {
    if (!stepInput.trim()) return;
    setSteps([...steps, stepInput.trim()]);
    setStepInput("");
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setTags([...tags, tagInput.trim().toLowerCase()]);
    setTagInput("");
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to add recipes");
      return;
    }

    if (!title) {
      toast.error("Title is required");
      return;
    }

    if (ingredients.length === 0) {
      toast.error("At least one ingredient is required");
      return;
    }

    if (steps.length === 0) {
      toast.error("At least one step is required");
      return;
    }

    try {
      setIsSubmitting(true);

      const recipeId = initialRecipe?.recipe_id || uuidv4();
      const recipeRef = doc(db, "recipes", recipeId);

      const recipeData = {
        recipe_id: recipeId,
        title,
        ingredients,
        steps,
        tags,
        createdAt: isEditing ? undefined : Timestamp.now(),
        creatorId: user.uid
      };

      // Remove undefined fields for updating
      if (isEditing) {
        Object.keys(recipeData).forEach(key => {
          if (recipeData[key as keyof typeof recipeData] === undefined) {
            delete recipeData[key as keyof typeof recipeData];
          }
        });
      }

      await setDoc(recipeRef, recipeData, { merge: isEditing });

      toast.success(isEditing ? "Recipe Updated" : "Recipe Added");
      navigate("/");
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error(isEditing ? "Failed to update recipe" : "Failed to add recipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="label">
          Recipe Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="Enter recipe title"
          required
        />
      </div>

      <div>
        <label className="label">Ingredients</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIngredient())}
            className="input flex-1"
            placeholder="Add an ingredient"
          />
          <button
            type="button"
            onClick={addIngredient}
            className="btn-secondary"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm">{ingredient}</span>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-red-500 hover:text-red-700"
                aria-label={`Remove ${ingredient}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {ingredients.length === 0 && (
            <p className="text-sm text-gray-500">No ingredients added yet</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Steps</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={stepInput}
            onChange={(e) => setStepInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStep())}
            className="input flex-1"
            placeholder="Add a step"
          />
          <button
            type="button"
            onClick={addStep}
            className="btn-secondary"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-start">
                <span className="font-medium mr-2">{index + 1}.</span>
                <span className="text-sm">{step}</span>
              </div>
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="text-red-500 hover:text-red-700 ml-2"
                aria-label={`Remove step ${index + 1}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {steps.length === 0 && (
            <p className="text-sm text-gray-500">No steps added yet</p>
          )}
        </div>
      </div>

      <div>
        <label className="label">Tags (e.g., dinner, vegan)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            className="input flex-1"
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={addTag}
            className="btn-secondary"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div key={index} className="flex items-center bg-green-100 text-green-700 px-3 py-1 rounded-full">
              <span className="text-sm">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-1 text-green-700 hover:text-green-900"
                aria-label={`Remove tag ${tag}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-gray-500">No tags added yet</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Recipe" : "Add Recipe"}
        </button>
      </div>
    </form>
  );
};

export default AddRecipeForm;
