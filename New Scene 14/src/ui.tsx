import { Animator, AudioSource, AvatarAnchorPointType, AvatarAttach, ColliderLayer, engine, Entity, GltfContainer, InputAction, inputSystem, Material, MeshCollider, MeshRenderer, NetworkEntity, PlayerIdentityData, pointerEventsSystem, PointerEventType, RaycastQueryType, raycastSystem, Schemas, TextureWrapMode, timers, Transform, TriggerArea, triggerAreaEventsSystem, VisibilityComponent } from "@dcl/sdk/ecs"
import { Quaternion, Vector2, Vector3 } from "@dcl/sdk/math"
import { isStateSyncronized, syncEntity } from "@dcl/sdk/network"
import ReactEcs, { ReactEcsRenderer, UiEntity } from "@dcl/sdk/react-ecs"
import { getPlayer, onEnterScene, onLeaveScene } from '@dcl/sdk/src/players'
import { MessageBus } from '@dcl/sdk/message-bus'

let getSceneAdmins: string[]
let getSceneHost: { active: boolean, wallet: string, latestSync: number }
let getScenePlayers: { wallet: string, name: string, online: boolean, state: PlayerState }[]
let getGameSettings: {
  area: {
    position: Vector3,
    scale: Vector3,
    tilesNumberX: number,
    tilesNumberZ: number,
    tilesSize: number
  },
  numberPlayersMin: number,
  numberPlayersMax: number,
  modeArea: ModeAreaGeneration,
  modeNPC: SessionModeNPC,
  waiting: number,
  duration: number,
  cooldown: number,
  phaseInterval: number
}
let getGameSession: {
  sessionId: string,
  state: SessionState,
  modeNPC: SessionModeNPC,
  startWaiting: number,
  gameDuration: number,
  phase: number,

  players: {
    wallet: string,
    team: TeamType,
    items: ItemType[],
    hp: number
  }[],

  npcs: {
    npcId: string,
    position: Vector3,
    rotation: Quaternion,
    team: TeamType,
    items: ItemType[],
    hp: number
  }[],

  hitPlayer: {
    deal: string,
    receive: string,
    damage: string,
    time: number
  }[],

  hitBarrier: {
    deal: string,
    receiveBarrierId: string,
    damage: string,
    time: number
  }[],
  
  result: string
}[]
let getGameArea: {
  position: Vector3,
  scale: Vector3,
  tilesNumberX: number,
  tilesNumberZ: number,
  tilesSize: number
}
let getGameTiles: {
  tileId: number,
  tileDynamic: boolean,
  tileX: number,
  tileZ: number,
  tileGround: GroundType,
  position: Vector3,
  rotation: Quaternion,
  scale: Vector3,
  barrier: {
    barrierId: number,
    tileSide: boolean,
    barrierDynamic: boolean,
    type: BarrierType,
    position: Vector3,
    rotation: Quaternion,
    scale: Vector3,
    hp: number,
    lock: boolean,
    barrierButton: {
      barrierButtonId: number,
      barrierSide: boolean,
      type: ButtonType,
      position: Vector3,
      rotation: Quaternion,
      scale: Vector3
    }[]
  }[],
  item: {
    itemId: number,
    type: ItemType,
    position: Vector3,
    rotation: Quaternion,
    scale: Vector3
  }[]
}[]
let getGameAreaGeneration: {
  template: {
    area: {
      position: Vector3,
      scale: Vector3,
      tilesNumberX: number,
      tilesNumberZ: number,
      tilesSize: number
    },

    phase: {
      tiles: {
        tileDynamic: boolean,
        tileX: number,
        tileZ: number,
        tileGround: GroundType,
        position: Vector3,
        rotation: Quaternion,
        scale: Vector3,
        barrier: {
          tileSide: boolean,
          barrierDynamic: boolean,
          type: BarrierType,
          position: Vector3,
          rotation: Quaternion,
          scale: Vector3,
          hp: number,
          lock: boolean,
          barrierButton: {
            barrierSide: boolean,
            type: ButtonType,
            position: Vector3,
            rotation: Quaternion,
            scale: Vector3
          }[]
        }[],
        item: {
          type: ItemType,
          position: Vector3,
          rotation: Quaternion,
          scale: Vector3
        }[]
      }[]
    }[]
  }[]
}

let sceneAdmin: boolean = false
let scenePlayersOnline: { wallet: string, name: string, online: boolean, state: PlayerState }[]
let gamePlayerTriggerArea: Entity = 0 as Entity
export let gameButtons: { join: Entity, cancel: Entity, view: Entity } = { join: 0 as Entity, cancel: 0 as Entity, view: 0 as Entity }
const sceneMessageBus = new MessageBus()

export enum PlayerState {
  IDLE = 'idle',
  JOIN = 'join',
  PLAY = 'play',
  VIEW = 'view',
  NONE = 'none'
}

export enum SessionState {
  WAIT = 'wait',
  CONTINUE = 'continue',
  END = 'end',
  CANCEL = 'cancel',
  NONE = 'none'
}

export enum ModeAreaGeneration {
  TEMPLATE = 'template',
  PARTIAL = 'partial',
  RANDON = 'random',
  NONE = 'none'
}

export enum SessionModeNPC {
  STANDART = 'standart',
  VIP = 'vip',
  PLAYER = 'player',
  NONE = 'none'
}

export enum TeamType {
  BODYGUARD = 'bodyguard',
  HATER = 'hater',
  VIP = 'vip',
  NONE = 'none'
}

export enum ItemType {
  SWORD = 'sword',
  BARREL = 'barrel',
  NONE = 'none'
}

export enum TileState {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  NONE = 'none'
}

export enum GroundType {
  STONE = 'stone',
  TILE = 'tile',
  GRASS = 'grass',
  TELEPORT = 'teleport',
  SPAWN = 'spawn',
  SAFE = 'safe',
  NONE = 'none'
}

export enum BarrierState {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  NONE = 'none'
}

export enum BarrierType {
  WALL = 'wall',
  BUSH = 'bush',
  FENCE = 'fence',
  DOOR = 'door',
  TELEPORT = 'teleport',
  NONE = 'none'
}

export enum ButtonType {
  JOIN = 'join',
  CANCEL = 'cancel',
  VIEW = 'view',
  DOOR = 'door',
  RONDOM = 'random',
  TELEPORT = 'teleport',
  NONE = 'none'
}

export enum UpdateEntityState {
  ADD = 'add',
  UPDATE = 'update',
  REMOVE = 'remove'
}

export enum UpdateEntityType {
  BUTTON = 'button',
  TILE = 'tile',
  BARRIER = 'barrier',
  ITEM = 'item',
  NPC = 'npc',
  NONE = 'none'
}

export enum WrapModeState {
  CLAMP = 'clamp',
  REPEAT = 'repeat',
  MIRROR = 'mirror'
}
export enum ShapeType {
  BOX = 'box',
  PLANE = 'plane',
  SPHERE = 'sphere',
  CYLINDER = 'cylinder',
  NONE = 'none'
}
export enum MeshColliderType {
  PHYSICS = 'physics',
  POINTER = 'pointer',
  CUSTOM1 = 'custom1',
  CUSTOM2 = 'custom2',
  CUSTOM3 = 'custom3',
  CUSTOM4 = 'custom4',
  CUSTOM5 = 'custom5',
  CUSTOM6 = 'custom6',
  CUSTOM7 = 'custom7',
  CUSTOM8 = 'custom8',
  NONE = 'none'
}
export const MeshColliderMap = {
  [MeshColliderType.PHYSICS]: ColliderLayer.CL_PHYSICS,
  [MeshColliderType.POINTER]: ColliderLayer.CL_POINTER,
  [MeshColliderType.CUSTOM1]: ColliderLayer.CL_CUSTOM1,
  [MeshColliderType.CUSTOM2]: ColliderLayer.CL_CUSTOM2,
  [MeshColliderType.CUSTOM3]: ColliderLayer.CL_CUSTOM3,
  [MeshColliderType.CUSTOM4]: ColliderLayer.CL_CUSTOM4,
  [MeshColliderType.CUSTOM5]: ColliderLayer.CL_CUSTOM5,
  [MeshColliderType.CUSTOM6]: ColliderLayer.CL_CUSTOM6,
  [MeshColliderType.CUSTOM7]: ColliderLayer.CL_CUSTOM7,
  [MeshColliderType.CUSTOM8]: ColliderLayer.CL_CUSTOM8,
  [MeshColliderType.NONE]: ColliderLayer.CL_NONE
}

type MeshColliderName = keyof typeof MeshColliderMap

export const SceneAdmins = engine.defineComponent('SceneAdmins', {
  wallets: Schemas.Array(Schemas.String)
})

export const SceneHost = engine.defineComponent('SceneHost', {
  host: Schemas.Map({
    active: Schemas.Boolean,
    wallet: Schemas.String,
    latestSync: Schemas.Number
  })
})

export const ScenePlayers = engine.defineComponent('ScenePlayers', {
  players: Schemas.Array(
    Schemas.Map({
      wallet: Schemas.String,
      name: Schemas.String,
      online: Schemas.Boolean,
      state: Schemas.EnumString<PlayerState>(PlayerState, PlayerState.NONE),
    })
  )
})

export const GameSettings = engine.defineComponent('GameSettings', {
  settings: Schemas.Map({
    area: Schemas.Map({
      position: Schemas.Vector3,
      scale: Schemas.Vector3,
      tilesNumberX: Schemas.Number,
      tilesNumberZ: Schemas.Number,
      tilesSize: Schemas.Number
    }),
    numberPlayersMin: Schemas.Number,
    numberPlayersMax: Schemas.Number,
    modeArea: Schemas.EnumString<ModeAreaGeneration>(ModeAreaGeneration, ModeAreaGeneration.NONE),
    modeNPC: Schemas.EnumString<SessionModeNPC>(SessionModeNPC, SessionModeNPC.NONE),
    waiting: Schemas.Number,
    duration: Schemas.Number,
    cooldown: Schemas.Number,
    phaseInterval: Schemas.Number
  })
})

export const GameSessions = engine.defineComponent('GameSessions', {
  gameSession: Schemas.Array(
    Schemas.Map({
      sessionId: Schemas.String,
      state: Schemas.EnumString<SessionState>(SessionState, SessionState.NONE),
      modeNPC: Schemas.EnumString<SessionModeNPC>(SessionModeNPC, SessionModeNPC.NONE),
      startWaiting: Schemas.Number,
      gameDuration: Schemas.Number,
      phase: Schemas.Number,

      players: Schemas.Array(
        Schemas.Map({
          wallet: Schemas.String,
          team: Schemas.EnumString<TeamType>(TeamType, TeamType.NONE),
          items: Schemas.Array(Schemas.EnumString<ItemType>(ItemType, ItemType.NONE)),
          hp: Schemas.Number
        })
      ),

      npcs: Schemas.Array(
        Schemas.Map({
          npcId: Schemas.String,
          position: Schemas.Vector3,
          rotation: Schemas.Quaternion,
          team: Schemas.EnumString<TeamType>(TeamType, TeamType.NONE),
          items: Schemas.Array(Schemas.EnumString<ItemType>(ItemType, ItemType.NONE)),
          hp: Schemas.Number
        })
      ),

      hitPlayer: Schemas.Array(
        Schemas.Map({
          deal: Schemas.String,
          receive: Schemas.String,
          damage: Schemas.String,
          time: Schemas.Number
        })
      ),

      hitBarrier: Schemas.Array(
        Schemas.Map({
          deal: Schemas.String,
          receiveBarrierId: Schemas.String,
          damage: Schemas.String,
          time: Schemas.Number
        })
      ),
      
      result: Schemas.String
    })
  )
})

export const GameArea = engine.defineComponent('GameArea', {
  area: Schemas.Map({
    position: Schemas.Vector3,
    scale: Schemas.Vector3,
    tilesNumberX: Schemas.Number,
    tilesNumberZ: Schemas.Number,
    tilesSize: Schemas.Number
  }),

  tiles: Schemas.Array(
    Schemas.Map({
      tileId: Schemas.Number,
      tileDynamic: Schemas.Boolean,
      tileX: Schemas.Number,
      tileZ: Schemas.Number,
      tileGround: Schemas.EnumString<GroundType>(GroundType, GroundType.NONE),
      position: Schemas.Vector3,
      rotation: Schemas.Vector3,
      scale: Schemas.Vector3,
      barrier: Schemas.Array(
        Schemas.Map({
          barrierId: Schemas.Number,
          tileSide: Schemas.Boolean,
          barrierDynamic: Schemas.Boolean,
          type: Schemas.EnumString<BarrierType>(BarrierType, BarrierType.NONE),
          position: Schemas.Vector3,
          rotation: Schemas.Quaternion,
          scale: Schemas.Vector3,
          hp: Schemas.Number,
          lock: Schemas.Boolean,
          barrierButton: Schemas.Array(
            Schemas.Map({
              barrierButtonId: Schemas.Number,
              barrierSide: Schemas.Boolean,
              type: Schemas.EnumString<ButtonType>(ButtonType, ButtonType.NONE),
              position: Schemas.Vector3,
              rotation: Schemas.Quaternion,
              scale: Schemas.Vector3
            })
          )
        })
      ),
      item: Schemas.Array(
        Schemas.Map({
          itemId: Schemas.Number,
          type: Schemas.EnumString<ItemType>(ItemType, ItemType.NONE),
          position: Schemas.Vector3,
          rotation: Schemas.Quaternion,
          scale: Schemas.Vector3
        })
      )
    })
  )
})

export const GameAreaGeneration = engine.defineComponent('GameAreaGeneration', {
  template: Schemas.Array(
    Schemas.Map({
      area: Schemas.Map({
        position: Schemas.Vector3,
        scale: Schemas.Vector3,
        tilesNumberX: Schemas.Number,
        tilesNumberZ: Schemas.Number,
        tilesSize: Schemas.Number
      }),

      phase: Schemas.Array(
        Schemas.Map({
          tiles: Schemas.Array(
            Schemas.Map({
              tileDynamic: Schemas.Boolean,
              tileX: Schemas.Number,
              tileZ: Schemas.Number,
              tileGround: Schemas.EnumString<GroundType>(GroundType, GroundType.NONE),
              position: Schemas.Vector3,
              rotation: Schemas.Quaternion,
              scale: Schemas.Vector3,
              barrier: Schemas.Array(
                Schemas.Map({
                  tileSide: Schemas.Boolean,
                  barrierDynamic: Schemas.Boolean,
                  type: Schemas.EnumString<BarrierType>(BarrierType, BarrierType.NONE),
                  position: Schemas.Vector3,
                  rotation: Schemas.Quaternion,
                  scale: Schemas.Vector3,
                  hp: Schemas.Number,
                  lock: Schemas.Boolean,
                  barrierButton: Schemas.Array(
                    Schemas.Map({
                      barrierSide: Schemas.Boolean,
                      type: Schemas.EnumString<ButtonType>(ButtonType, ButtonType.NONE),
                      position: Schemas.Vector3,
                      rotation: Schemas.Quaternion,
                      scale: Schemas.Vector3
                    })
                  )
                })
              ),
              item: Schemas.Array(
                Schemas.Map({
                  type: Schemas.EnumString<ItemType>(ItemType, ItemType.NONE),
                  position: Schemas.Vector3,
                  rotation: Schemas.Quaternion,
                  scale: Schemas.Vector3
                })
              )
            })
          )
        })
      )
    })
  )
})

export function getSyncEntity() {
  for (const [entity] of engine.getEntitiesWith(SceneAdmins, SceneHost, ScenePlayers, GameSettings, GameSessions, GameArea, GameAreaGeneration)) {
    getSceneAdmins = SceneAdmins.get(entity).wallets
    getScenePlayers = ScenePlayers.get(entity).players as typeof getScenePlayers
    getSceneHost = SceneHost.get(entity).host
    getGameSettings = GameSettings.get(entity).settings
    getGameSession = GameSessions.get(entity).gameSession as typeof getGameSession
    getGameArea = GameArea.get(entity).area
    getGameTiles = GameArea.get(entity).tiles as typeof getGameTiles
    getGameAreaGeneration = GameAreaGeneration.get(entity) as typeof getGameAreaGeneration
    return entity
  }
}

export function getHost() {
  const entity = getSyncEntity()
  const myPlayer = getPlayer()
  if (entity && myPlayer) {
    scenePlayersOnline = getScenePlayers.filter(player => player.online === true)
    const scenePlayersNoHost = scenePlayersOnline.filter(player => player.wallet !== getSceneHost.wallet)
    if(scenePlayersOnline.length === 0 && getSceneHost.wallet === '') {
      SceneHost.getMutable(entity).host = { active: true, wallet: myPlayer?.userId, latestSync: Date.now() }
    } else if (getSceneHost.active === false && scenePlayersNoHost.length > 0 && scenePlayersNoHost[0].wallet === myPlayer?.userId) {
      const getRandomHost = Math.floor(Math.random() * scenePlayersNoHost.length)
      const newSceneHost = getScenePlayers.find(player => player.wallet === scenePlayersNoHost[getRandomHost].wallet)
      if (newSceneHost) {
        SceneHost.getMutable(entity).host = { active: true, wallet: newSceneHost?.wallet, latestSync: Date.now() }
      }
    } else if (getSceneHost.active === true && getSceneHost.wallet === myPlayer?.userId) {
      SceneHost.getMutable(entity).host.latestSync = Date.now()
      //console.log('host time sync: ', Date.now())
    }

    if (getSceneAdmins.some(wallet => wallet === myPlayer?.userId)) {
      sceneAdmin = true
    }

    if (scenePlayersOnline.length === 0 && getSceneHost.wallet === '' || getSceneHost.wallet === myPlayer?.userId) {
      onEnterScene((enterPlayer) => {
        if (!enterPlayer) return
        const scenePlayer = getScenePlayers.findIndex(player => player.wallet === enterPlayer?.userId)
        if (scenePlayer > -1) {
          scenePlayersOnline[scenePlayer].online = true
          scenePlayersOnline[scenePlayer].state = PlayerState.IDLE
          ScenePlayers.getMutable(entity).players[scenePlayer] = scenePlayersOnline[scenePlayer]
        } else {
          ScenePlayers.getMutable(entity).players.push({ wallet: enterPlayer?.userId, name: enterPlayer?.name, online: true, state: PlayerState.IDLE })
          scenePlayersOnline.push({ wallet: enterPlayer?.userId, name: enterPlayer?.name, online: true, state: PlayerState.IDLE })
        }
      })
    }
    if (scenePlayersOnline.length >= 2) {
      onLeaveScene((userId) => {
        if (!userId) return
        const leavePlayerIndex = getScenePlayers.findIndex(player => player.wallet === userId)
        scenePlayersOnline[leavePlayerIndex].online = false
        scenePlayersOnline[leavePlayerIndex].state = PlayerState.NONE
        if (getSceneHost.wallet !== userId && getSceneHost.wallet === myPlayer?.userId) {
          ScenePlayers.getMutable(entity).players[leavePlayerIndex] = scenePlayersOnline[leavePlayerIndex]
        } else if (getSceneHost.wallet === userId) {
          const remainingPlayers = getScenePlayers.filter(player => player.wallet !== userId).filter(player => player.wallet !== getSceneHost.wallet)
          if (remainingPlayers[0].wallet !== userId) {
            ScenePlayers.getMutable(entity).players[leavePlayerIndex] = scenePlayersOnline[leavePlayerIndex]
          }
        }
      })
    }
  }
}

export function updateGameEntity(
  updateEntityState: UpdateEntityState,
  updateEntitySync: boolean,
  updateEntityType: UpdateEntityType,
  updateEntitySubtype: ButtonType | BarrierType | GroundType | ItemType | TeamType,
  components: {
    entity?: Entity,
    player?: Entity,
    transform?: {
      position?: Vector3,
      rotation?: Quaternion,
      scale?: Vector3,
      parent?: Entity
    },
    material?: {
      texture?: {
        src: string,
        wrapMode?: TextureWrapMode,
        offset?: Vector2,
        tiling?: Vector2
      },
      color?: { r: number, g: number, b: number, a: number }
    },
    gltfContainer?: {
      src: string,
      invisibleCollision?: MeshColliderName | MeshColliderName[],
      visibleCollision?: MeshColliderName | MeshColliderName[]
    },
    visibility?: {
      visible?: boolean,
      propagateToChildren?: boolean,
    },
    animator?: {
      states: {
        clip: string,
        playing?: boolean,
        loop?: boolean
      }[]
    },
    audioSource?: {
      audioClipUrl: string,
      playing?: boolean,
      loop?: boolean,
      global?: boolean
    },
    meshCollider?: { shape: ShapeType, visibleCollision?: MeshColliderName | MeshColliderName[] },
    meshRenderer?: { shape: ShapeType }
    triggerArea?: { shape: ShapeType, invisibleCollision?: MeshColliderName | MeshColliderName[] },
    avatarAttach?: { attach: boolean }
    pointer?: {
      opts: {
        button: InputAction,
        hoverText?: string
        maxDistance?: number
      },
      pointerFunction?: {}
    }
  }
) {
  let entity: Entity | undefined
  if (updateEntityState === UpdateEntityState.ADD) {
    if (components.player) {
      entity = components.player
    } else {
      entity = engine.addEntity()
    }
  } else if (updateEntityState === UpdateEntityState.UPDATE && components.entity) {
    entity = components.entity
  } else if (updateEntityState === UpdateEntityState.REMOVE && components.entity) {
    entity = components.entity
    engine.removeEntity(entity)
    return
  }
  if (!entity) return

  if (updateEntityState === UpdateEntityState.ADD &&
    updateEntitySync === false &&
    updateEntityType === UpdateEntityType.BUTTON &&
    updateEntitySubtype === ButtonType.JOIN
  ) {
    gameButtons.join = entity
    if (components.transform) {
    let transformData: any = {}
      components.transform.position ? transformData.position = components.transform.position : null
      components.transform.rotation ? transformData.rotation = components.transform.rotation : null
      components.transform.scale ? transformData.scale = components.transform.scale : null
      components.transform.parent ? transformData.parent = components.transform.parent : null
      Transform.createOrReplace(entity, transformData)
    }
    GltfContainer.createOrReplace(entity, {
      src: 'assets/asset-packs/green_light_button/green_scifi_button.glb',
      invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
      visibleMeshesCollisionMask: ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER
    })
    VisibilityComponent.createOrReplace(entity, {
      visible: true
    })
    Animator.createOrReplace(entity, {
      states: [{ clip: 'trigger', playing: false, loop: false }]
    })
    pointerEventsSystem.onPointerDown(
      {
        entity: entity,
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: 'Click',
          maxDistance: 10
        }
      },
      (event) => {
        GltfContainer.createOrReplace(entity, {
          src: 'assets/asset-packs/green_light_button/green_scifi_button.glb',
          invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
          visibleMeshesCollisionMask: ColliderLayer.CL_NONE
        })
        AudioSource.createOrReplace(entity, {
          audioClipUrl: 'assets/asset-packs/green_light_button/sound.mp3',
          playing: true,
          global: true
        })
        VisibilityComponent.createOrReplace(entity, {
          visible: false
        })
        GltfContainer.createOrReplace(gameButtons.cancel, {
          src: 'assets/asset-packs/red_light_button/red_scifi_button.glb',
          invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
          visibleMeshesCollisionMask: ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER
        })
        VisibilityComponent.createOrReplace(gameButtons.cancel, {
          visible: true
        })
        Animator.createOrReplace(gameButtons.cancel, {
          states: [{ clip: 'trigger', playing: true, loop: false }]
        })
        const myPlayer = getPlayer()
        if (!getGameSession || getGameSession.length === 0) {
          sceneMessageBus.emit('playerJoin', { player: myPlayer })
        } else if (getGameSession[getGameSession.length - 1].state === SessionState.CANCEL ||
          getGameSession[getGameSession.length - 1].state === SessionState.END
        ) {
          sceneMessageBus.emit('playerJoin', { player: myPlayer })
        } else if (getGameSession[getGameSession.length - 1].state === SessionState.WAIT) {
          sceneMessageBus.emit('playerJoin', { player: myPlayer })
        }
      }
    )
  }
  if (updateEntityState === UpdateEntityState.ADD &&
    updateEntitySync === false &&
    updateEntityType === UpdateEntityType.BUTTON &&
    updateEntitySubtype === ButtonType.CANCEL
  ) {
    gameButtons.cancel = entity
    Transform.createOrReplace(entity, {
      position: Vector3.create(16, 1.8, 13.25),
      rotation: Quaternion.fromEulerDegrees(270, 0, 0)
    })
    GltfContainer.createOrReplace(entity, {
      src: 'assets/asset-packs/red_light_button/red_scifi_button.glb',
      invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
      visibleMeshesCollisionMask: ColliderLayer.CL_NONE
    })
    VisibilityComponent.createOrReplace(entity, {
      visible: false
    })
    Animator.createOrReplace(entity, {
      states: [{ clip: 'trigger', playing: false, loop: false }]
    })
    pointerEventsSystem.onPointerDown(
      {
        entity: entity,
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: 'Click',
          maxDistance: 10
        }
      },
      (event) => {
        GltfContainer.createOrReplace(entity, {
          src: 'assets/asset-packs/red_light_button/red_scifi_button.glb',
          invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
          visibleMeshesCollisionMask: ColliderLayer.CL_NONE
        })
        AudioSource.createOrReplace(entity, {
          audioClipUrl: 'assets/asset-packs/red_light_button/sound.mp3',
          playing: true,
          global: true
        })
        VisibilityComponent.createOrReplace(entity, {
          visible: false
        })
        GltfContainer.createOrReplace(gameButtons.join, {
          src: 'assets/asset-packs/green_light_button/green_scifi_button.glb',
          invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
          visibleMeshesCollisionMask: ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER
        })
        VisibilityComponent.createOrReplace(gameButtons.join, {
          visible: true
        })
        Animator.createOrReplace(gameButtons.join, {
          states: [{ clip: 'trigger', playing: true, loop: false }]
        })
      }
    )
  }
  if (updateEntityState === UpdateEntityState.ADD &&
    updateEntitySync === false &&
    updateEntityType === UpdateEntityType.BUTTON &&
    updateEntitySubtype === ButtonType.VIEW
  ) {
    gameButtons.view = entity
    Transform.createOrReplace(entity, {
      position: Vector3.create(16, 1.8, 13.25),
      rotation: Quaternion.fromEulerDegrees(270, 0, 0)
    })
    GltfContainer.createOrReplace(entity, {
      src: 'assets/asset-packs/blue_light_button/blue_scifi_button.glb',
      invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
      visibleMeshesCollisionMask: ColliderLayer.CL_NONE
    })
    VisibilityComponent.createOrReplace(entity, {
      visible: false
    })
    Animator.createOrReplace(entity, {
      states: [{ clip: 'trigger', playing: false, loop: false }]
    })
    pointerEventsSystem.onPointerDown(
      {
        entity: entity,
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: 'Click',
          maxDistance: 10
        }
      },
      (event) => {
        /*GltfContainer.createOrReplace(entity, {
          src: 'assets/asset-packs/blue_light_button/blue_scifi_button.glb',
          invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
          visibleMeshesCollisionMask: ColliderLayer.CL_NONE
        })*/
        Animator.createOrReplace(entity, {
          states: [{ clip: 'trigger', playing: true, loop: false }]
        })
        AudioSource.createOrReplace(entity, {
          audioClipUrl: 'assets/asset-packs/blue_light_button/sound.mp3',
          playing: true,
          global: true
        })
      }
    )
  }
  if (updateEntityState === UpdateEntityState.ADD &&
    updateEntitySync === false &&
    updateEntityType === UpdateEntityType.BARRIER &&
    updateEntitySubtype === BarrierType.WALL
  ) {
    if (components.transform) {
      let transformData: any = {}
      components.transform.position ? transformData.position = components.transform.position : null
      components.transform.rotation ? transformData.rotation = components.transform.rotation : null
      components.transform.scale ? transformData.scale = components.transform.scale : null
      components.transform.parent ? transformData.parent = components.transform.parent : null
      Transform.createOrReplace(entity, transformData)
    }
    if (components.material) {
      if (components.material.texture) {
        const textureData: any = {}
        const materialData: any = {}
        components.material.texture.src ? textureData.src = components.material.texture.src : null
        components.material.texture.wrapMode ? textureData.wrapMode = components.material.texture.wrapMode : null
        components.material.texture.offset ? textureData.offset = components.material.texture.offset : null
        components.material.texture.tiling ? textureData.tiling = components.material.texture.tiling : null
        materialData.texture = Material.Texture.Common(textureData)
        Material.setBasicMaterial(entity, materialData)
      }
    }
    if (components.meshCollider) {
      if (components.meshCollider.visibleCollision) {
        if (components.meshCollider.shape === ShapeType.BOX) {
          MeshCollider.setBox(entity, parseCollider(components.meshCollider.visibleCollision))
        } else if (components.meshCollider.shape === ShapeType.PLANE) {
          MeshCollider.setPlane(entity, parseCollider(components.meshCollider.visibleCollision))
        } else if (components.meshCollider.shape === ShapeType.SPHERE) {
          MeshCollider.setSphere(entity, parseCollider(components.meshCollider.visibleCollision))
        } else if (components.meshCollider.shape === ShapeType.CYLINDER) {
          MeshCollider.setCylinder(entity, parseCollider(components.meshCollider.visibleCollision))
        }
      } else {
        if (components.meshCollider.shape === ShapeType.BOX) {
          MeshCollider.setBox(entity)
        } else if (components.meshCollider.shape === ShapeType.PLANE) {
          MeshCollider.setPlane(entity)
        } else if (components.meshCollider.shape === ShapeType.SPHERE) {
          MeshCollider.setSphere(entity)
        } else if (components.meshCollider.shape === ShapeType.CYLINDER) {
          MeshCollider.setCylinder(entity)
        }
      }
    }
    if (components.meshRenderer) {
      if (components.meshRenderer.shape === ShapeType.BOX) {
        MeshRenderer.setBox(entity)
      } else if (components.meshRenderer.shape === ShapeType.PLANE) {
        MeshRenderer.setPlane(entity)
      } else if (components.meshRenderer.shape === ShapeType.SPHERE) {
        MeshRenderer.setSphere(entity)
      } else if (components.meshRenderer.shape === ShapeType.CYLINDER) {
        MeshRenderer.setCylinder(entity)
      }
    }
  }
  /*if (components.transform) {
    let transformData: any = {}
    components.transform.position ? transformData.position = components.transform.position : null
    components.transform.rotation ? transformData.rotation = components.transform.rotation : null
    components.transform.scale ? transformData.scale = components.transform.scale : null
    components.transform.parent ? transformData.parent = components.transform.parent : null
    Transform.createOrReplace(entity, transformData)
  }
  if (components.material) {
    if (components.material.texture) {
      const textureData: any = {}
      const materialData: any = {}
      components.material.texture.src ? textureData.src = components.material.texture.src : null
      components.material.texture.wrapMode ? textureData.wrapMode = components.material.texture.wrapMode : null
      components.material.texture.offset ? textureData.offset = components.material.texture.offset : null
      components.material.texture.tiling ? textureData.tiling = components.material.texture.tiling : null
      materialData.texture = Material.Texture.Common(textureData)
      Material.setBasicMaterial(entity, materialData)
    }
  }
  if (components.gltfContainer) {
    const gltfData: any = {}
    components.gltfContainer.src ? gltfData.src = components.gltfContainer.src : null
    components.gltfContainer.invisibleCollision ? gltfData.invisibleMeshesCollisionMask = parseCollider(components.gltfContainer.invisibleCollision) : null
    components.gltfContainer.visibleCollision ? gltfData.visibleMeshesCollisionMask = parseCollider(components.gltfContainer.visibleCollision) : null
    GltfContainer.createOrReplace(entity, gltfData)
  }
  if (components.visibility) {
    VisibilityComponent.createOrReplace(entity, {
      visible: components.visibility.visible,
    })
  }
  if (components.animator) {
    Animator.createOrReplace(entity, {
      ...components.animator
    })
  }
  if (components.audioSource) {
    AudioSource.createOrReplace(entity, {
      ...components.audioSource
    })
  }
  if (components.meshCollider) {
    if (components.meshCollider.visibleCollision) {
      if (components.meshCollider.shape === ShapeType.BOX) {
        MeshCollider.setBox(entity, parseCollider(components.meshCollider.visibleCollision))
      } else if (components.meshCollider.shape === ShapeType.PLANE) {
        MeshCollider.setPlane(entity, parseCollider(components.meshCollider.visibleCollision))
      } else if (components.meshCollider.shape === ShapeType.SPHERE) {
        MeshCollider.setSphere(entity, parseCollider(components.meshCollider.visibleCollision))
      } else if (components.meshCollider.shape === ShapeType.CYLINDER) {
        MeshCollider.setCylinder(entity, parseCollider(components.meshCollider.visibleCollision))
      }
    } else {
      if (components.meshCollider.shape === ShapeType.BOX) {
        MeshCollider.setBox(entity)
      } else if (components.meshCollider.shape === ShapeType.PLANE) {
        MeshCollider.setPlane(entity)
      } else if (components.meshCollider.shape === ShapeType.SPHERE) {
        MeshCollider.setSphere(entity)
      } else if (components.meshCollider.shape === ShapeType.CYLINDER) {
        MeshCollider.setCylinder(entity)
      }
    }
  }
  if (components.meshRenderer) {
    if (components.meshRenderer.shape === ShapeType.BOX) {
      MeshRenderer.setBox(entity)
    } else if (components.meshRenderer.shape === ShapeType.PLANE) {
      MeshRenderer.setPlane(entity)
    } else if (components.meshRenderer.shape === ShapeType.SPHERE) {
      MeshRenderer.setSphere(entity)
    } else if (components.meshRenderer.shape === ShapeType.CYLINDER) {
      MeshRenderer.setCylinder(entity)
    }
  }
  if (components.triggerArea) {
    if (components.triggerArea.invisibleCollision) {
      if (components.triggerArea.shape === ShapeType.BOX) {
        TriggerArea.setBox(entity, parseCollider(components.triggerArea.invisibleCollision))
      } else if (components.triggerArea.shape === ShapeType.SPHERE) {
        TriggerArea.setSphere(entity, parseCollider(components.triggerArea.invisibleCollision))
      }
    } else {
      if (components.triggerArea.shape === ShapeType.BOX) {
        TriggerArea.setBox(entity)
      } else if (components.triggerArea.shape === ShapeType.SPHERE) {
        TriggerArea.setSphere(entity)
      }
    }
  }
  if (components.pointer) {
  const optsData: any = {}
  components.pointer.opts.button ? optsData.button = components.pointer.opts.button : null
  components.pointer.opts.hoverText ? optsData.hoverText = components.pointer.opts.hoverText : null
  components.pointer.opts.maxDistance ? optsData.maxDistance = components.pointer.opts.maxDistance : null
  let pointerFunction = (event: any) => { if (typeof components.pointer?.pointerFunction === 'function') { components.pointer.pointerFunction(event) } }
  const pointerData: any = {
    entity: entity,
    opts: optsData
  }
  
  pointerEventsSystem.onPointerDown(
    pointerData,
    pointerFunction
  )
  }*/
  return entity
}

export function newGameSession() {
  const entity = getSyncEntity()
  const myPlayer = getPlayer()
  if (entity && getSceneHost.wallet === myPlayer?.userId) {
    GameSessions.getMutable(entity).gameSession.push({
      sessionId: generateId(10)+'-'+Date.now(),
      state: SessionState.CONTINUE,
      modeNPC: SessionModeNPC.VIP,
      startWaiting: Date.now() + (getGameSettings.waiting * 1000),
      gameDuration: Date.now() + ((getGameSettings.waiting + getGameSettings.duration) * 1000),
      phase: 0,
      players: [{ wallet: myPlayer?.userId, team: TeamType.NONE, items: [], hp: 100}],
      npcs: [],
      hitPlayer: [],
      hitBarrier: [],
      result: ''
    })
    newGameAreaGeneration()
  }
}

export function newGameAreaGeneration() {
  const entity = getSyncEntity()
  let randomGameAreaGeneration
  if (entity) {
    if (getGameSettings.modeArea === ModeAreaGeneration.TEMPLATE && getGameAreaGeneration.template.length > 0) {
      const getGameAreaTemplate = getGameAreaGeneration.template.filter(template =>
        template.area.tilesNumberX === getGameSettings.area.tilesNumberX &&
        template.area.tilesNumberZ === getGameSettings.area.tilesNumberZ &&
        template.area.tilesSize === getGameSettings.area.tilesSize
      )
      if (getGameAreaTemplate.length > 0) {
        const getRandomGameAreaTemplate = Math.floor(Math.random() * getGameAreaTemplate.length)
        randomGameAreaGeneration = getGameAreaTemplate[getRandomGameAreaTemplate]
      }
    }
    if (randomGameAreaGeneration) {
      for (let i = 0; i < randomGameAreaGeneration.phase[0].tiles.length; i++) {

      }
    }
  }
}

export function getGameSessions() {
  const entity = getSyncEntity()
  const myPlayer = getPlayer()
  if (entity && myPlayer && getGameSession.length > 0 && getScenePlayers.some(player => player.wallet === myPlayer?.userId && player.online === true)) {
    if (getGameSession[getGameSession.length - 1].state === SessionState.WAIT && getGameSession[getGameSession.length - 1].startWaiting > Date.now()) {

    } else if (getGameSession[getGameSession.length - 1].state === SessionState.CONTINUE && getGameSession[getGameSession.length - 1].gameDuration > Date.now()) {

    } else if (getGameSession[getGameSession.length - 1].state === SessionState.WAIT && getGameSession[getGameSession.length - 1].startWaiting < Date.now()) {
      if (getSceneHost.wallet === myPlayer?.userId) {
        GameSessions.getMutable(entity).gameSession[getGameSession.length - 1].state = SessionState.CONTINUE
      }
    } else if (getGameSession[getGameSession.length - 1].state === SessionState.CONTINUE && getGameSession[getGameSession.length - 1].gameDuration < Date.now()) {
      if (getSceneHost.wallet === myPlayer?.userId) {
        GameSessions.getMutable(entity).gameSession[getGameSession.length - 1].state = SessionState.END
      }
    }
  }
}

export function getSyncedEntity(syncedEntity: number) {
  for (const [entity, networkData] of engine.getEntitiesWith(NetworkEntity)) {
    if (networkData.entityId === syncedEntity) {
      return entity
    }
  }
}

function parseCollider(input?: MeshColliderName | MeshColliderName[]): number {
  if (!input) return ColliderLayer.CL_NONE

  if (Array.isArray(input)) {
    return input.reduce((a, b) => a | MeshColliderMap[b], 0)
  }
  return MeshColliderMap[input]
}


function generateId(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

engine.addSystem(() => {
  if (isStateSyncronized()) {
    getHost()
    getSyncEntity()
    if (getGameSession.length > 0 &&
      (getGameSession[getGameSession.length - 1].state === SessionState.WAIT ||
      getGameSession[getGameSession.length - 1].state === SessionState.CONTINUE) &&
      !gamePlayerTriggerArea) {
      if (getGameSession[getGameSession.length - 1].state === SessionState.CONTINUE) {
        if (VisibilityComponent.get(gameButtons.join).visible === true) {
          GltfContainer.createOrReplace(gameButtons.join, {
            src: 'assets/asset-packs/green_light_button/green_scifi_button.glb',
            invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
            visibleMeshesCollisionMask: ColliderLayer.CL_NONE
          })
          VisibilityComponent.createOrReplace(gameButtons.join, {
            visible: false
          })
        }
        if (VisibilityComponent.get(gameButtons.cancel).visible === true) {
          GltfContainer.createOrReplace(gameButtons.cancel, {
            src: 'assets/asset-packs/red_light_button/red_scifi_button.glb',
            invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
            visibleMeshesCollisionMask: ColliderLayer.CL_NONE
          })
          VisibilityComponent.createOrReplace(gameButtons.cancel, {
            visible: false
          })
        }
        GltfContainer.createOrReplace(gameButtons.view, {
          src: 'assets/asset-packs/blue_light_button/blue_scifi_button.glb',
          invisibleMeshesCollisionMask: ColliderLayer.CL_NONE,
          visibleMeshesCollisionMask: ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER
        })
        VisibilityComponent.createOrReplace(gameButtons.view, {
          visible: true
        })
      }
      sceneMessageBus.on('playerJoin', (player) => {
        console.log('player join: ', JSON.stringify(player))
      })
      if (getGameSession[getGameSession.length - 1].players.some(player => player.wallet === getPlayer()?.userId)) {
        const playerTriggerArea = engine.addEntity()
        Transform.createOrReplace(playerTriggerArea, {
          position: Vector3.create(0, 1, 0),
          scale: Vector3.create(3, 3, 3),
          parent: engine.PlayerEntity
        })
        MeshRenderer.setSphere(playerTriggerArea)
        TriggerArea.setSphere(playerTriggerArea)
        triggerAreaEventsSystem.onTriggerEnter(playerTriggerArea, function(result) {
          if (result.trigger?.entity && result.trigger.entity !== getPlayer()?.entity) {
            
          }
        })
        triggerAreaEventsSystem.onTriggerStay(playerTriggerArea, function(result) {
          if (result.trigger?.entity && result.trigger.entity !== getPlayer()?.entity) {
            
          }
        })
        triggerAreaEventsSystem.onTriggerExit(playerTriggerArea, function(result) {
          if (result.trigger?.entity && result.trigger.entity !== getPlayer()?.entity) {
            
          }
        })
        gamePlayerTriggerArea = playerTriggerArea
      }
    } else if (getGameSession.length > 0 &&
      (getGameSession[getGameSession.length - 1].state === SessionState.CANCEL ||
      getGameSession[getGameSession.length - 1].state === SessionState.END) &&
      gamePlayerTriggerArea) {
      if (gamePlayerTriggerArea) {
        engine.removeEntity(gamePlayerTriggerArea)
      }
      gamePlayerTriggerArea = 0 as Entity
    }
    /*if (inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)) {
      
    }*/
  }
})

export function setupUi() {
    ReactEcsRenderer.setUiRenderer(uiMenu, { virtualWidth: 1920, virtualHeight: 1080 })
}

// draw your UI here
export const uiMenu = () => (
    <UiEntity>  
    </UiEntity>
)