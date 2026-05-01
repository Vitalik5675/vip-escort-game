import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { Animator, AudioSource, AvatarBase, AvatarEquippedData, engine, GltfContainer, InputAction, PlayerIdentityData, pointerEventsSystem, timers, Transform, NetworkEntity, MeshRenderer, executeTask, AvatarAttach, AvatarAnchorPointType, MeshCollider, VisibilityComponent } from '@dcl/sdk/ecs'
import { GameArea, GameSessions, SceneAdmins, SceneHost, ScenePlayers, getSyncEntity, getHost, setupUi, GameSettings, ModeAreaGeneration, SessionModeNPC, GameAreaGeneration, updateGameEntity, ButtonType, UpdateEntityState, UpdateEntityType, MeshColliderType, ShapeType } from './ui'
import { syncEntity, isStateSyncronized } from '@dcl/sdk/network'
import { getPlayer } from '@dcl/sdk/src/players'


export function main() {
  const entity = engine.addEntity()

  Transform.create(entity, {
    position: Vector3.create(0, 0, 0),
  })
  
  SceneAdmins.create(entity, {
    wallets: [
      '0x785aaba4a4efb0fa59b6e26c884c885ec7b2669a', //BITALIK
      '0x16f1d6d51c594b147ba40e3e113e9d24a24d193b', //Fabio
      '0x9b6994167b6de0de267f6450b4e6eecc2944dbc6', //Kara
    ]
  })

  SceneHost.create(entity, {
    host: { active: false, wallet: '', latestSync: 0 }
  })

  ScenePlayers.create(entity, {
    players: []
  })

  GameSettings.create(entity, {
    settings: {
      area: {
        position: Vector3.create(16, 8.5, 16),
        scale: Vector3.create(32, 5, 32),
        tilesNumberX: 8,
        tilesNumberZ: 8,
        tilesSize: 4
      },
      numberPlayersMin: 2,
      numberPlayersMax: 10,
      modeArea: ModeAreaGeneration.TEMPLATE,
      modeNPC: SessionModeNPC.VIP,
      waiting: 300,
      duration: 300,
      cooldown: 3,
      phaseInterval: 30
    }
  })

  GameSessions.create(entity, {
    gameSession: []
  })

  GameArea.create(entity, {
    area: { position: Vector3.create(16, 8.5, 16), scale: Vector3.create(32, 5, 32), tilesNumberX: 0, tilesNumberZ: 0, tilesSize: 0 },
    tiles: []
  })

  GameAreaGeneration.create(entity, {
    template: []
  })

  syncEntity(entity, [SceneAdmins.componentId, SceneHost.componentId, ScenePlayers.componentId, GameSessions.componentId, GameArea.componentId], 1)
  
  if (isStateSyncronized()) {
    getSyncEntity()
  }
  
  const box2 = engine.addEntity()
  MeshRenderer.setBox(box2)
  MeshCollider.setBox(box2)
  Transform.create(box2, {
    position: { x: 3, y: 1, z: 3 }, 
    scale: { x: 0.1, y: 2, z: 5 }
  })
  const box3 = engine.addEntity()
  MeshRenderer.setBox(box3)
  MeshCollider.setBox(box3)
  Transform.create(box3, {
    position: { x: 5, y: 1, z: 3 }, 
    scale: { x: 0.1, y: 2, z: 5 }
  })

  updateGameEntity(
    UpdateEntityState.ADD,
    true,
    UpdateEntityType.BUTTON,
    ButtonType.JOIN,
    {
      transform: {
        position: Vector3.create(16, 1.8, 13.25),
        rotation: Quaternion.fromEulerDegrees(270, 0, 0),
        scale: Vector3.create(1, 1, 1)
      },
      gltfContainer: {
        src: 'assets/asset-packs/green_light_button/green_scifi_button.glb',
        invisibleCollision: [MeshColliderType.NONE],
        visibleCollision: [MeshColliderType.PHYSICS, MeshColliderType.POINTER]
      },
      visibility: { visible: true },
      animator: {
        states: [{
          clip: 'trigger',
          playing: false
        }]
      }
    }
  )

  updateGameEntity(
    UpdateEntityState.ADD,
    true,
    UpdateEntityType.BUTTON,
    ButtonType.CANCEL,
    {
      transform: {
        position: Vector3.create(0, 0, 0),
        scale: Vector3.create(1, 2, 1)
      },
      meshRenderer: { shape: ShapeType.CYLINDER },
      avatarAttach: { attach: true }
    }
  )

  setupUi()
}

const timeoutId = timers.setTimeout(() => {
  for (const [entity, data] of engine.getEntitiesWith(PlayerIdentityData)) {
    const myEntity = engine.addEntity()

    MeshRenderer.setBox(myEntity)
    AvatarAttach.create(myEntity, {
        anchorPointId: AvatarAnchorPointType.AAPT_LEFT_HAND,
        avatarId: data.address,
    })
}
}, 5000)



const intervalId = timers.setInterval(() => {
  if (isStateSyncronized()) {
    getHost()
  }
  /*for (const [entity, networkData] of engine.getEntitiesWith(NetworkEntity)) {
    if (networkData.entityId === 1) {
      console.log("ID сутності:", entity)
      console.log("Мережевий ID сутності:", networkData.entityId)
    }
  }*/
}, 100)

/*engine.addSystem(() => {
    for (const [entity, data, base, attach, transform] of engine.getEntitiesWith(
        PlayerIdentityData,
        AvatarBase,
        AvatarEquippedData,
        Transform
    )) {
        console.log('PLAYER DATA: ', JSON.stringify({ entity, data, transform, base, attach }))
    }
})*/
