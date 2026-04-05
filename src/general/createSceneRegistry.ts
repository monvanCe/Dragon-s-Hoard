import { AceOfShadowsScene } from "@/components/scenes/AceOfShadowsScene";
import { MagicWordsScene } from "@/components/scenes/MagicWordsScene";
import { MenuScene } from "@/components/scenes/MenuScene";
import { PhoenixFlameScene } from "@/components/scenes/PhoenixFlameScene";
import type {
  SceneContext,
  SceneController,
  ScreenId,
} from "@/types/app";

/**
 * Central registry factory: one place to wire scenes to {@link SceneContext} (Open/Closed for new screens).
 */
export function createSceneRegistry(
  context: SceneContext,
): Map<ScreenId, SceneController> {
  const scenes: SceneController[] = [
    new MenuScene(context),
    new AceOfShadowsScene(context),
    new MagicWordsScene(context),
    new PhoenixFlameScene(context),
  ];

  return new Map(scenes.map((scene) => [scene.id, scene]));
}
