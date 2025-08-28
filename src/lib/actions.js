/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import useStore from './store'
import modes from './modes'
import llmGen from './llm'
import models from './models'

const get = useStore.getState
const set = useStore.setState

export const init = () => {
  if (get().didInit) {
    return
  }

  set(state => {
    state.didInit = true
  })
}

const newOutput = (model, mode, isBatch) => ({
  model,
  isBatch,
  id: crypto.randomUUID(),
  startTime: Date.now(),
  outputData: null,
  isBusy: true,
  gotError: false,
  outputMode: mode,
  rating: 0,
  isFavorite: false,
  comments: ''
})

export const addRound = (prompt, promptImage) => {
  scrollTo({top: 0, left: 0, behavior: 'smooth'})

  if (prompt) {
    set(state => {
      state.promptHistory = [
        prompt,
        ...state.promptHistory.filter(p => p !== prompt)
      ].slice(0, 50)
    })
  }

  const {outputMode, batchMode, batchSize, batchModel, versusModels} = get()

  if (!batchMode && Object.values(versusModels).every(active => !active)) {
    return
  }

  const newRound = {
    prompt,
    promptImage,
    systemInstruction: modes[outputMode].systemInstruction,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    outputMode,
    outputs: batchMode
      ? new Array(batchSize)
          .fill(null)
          .map(() => newOutput(batchModel, outputMode, true))
      : Object.entries(versusModels)
          .filter(([, active]) => active)
          .map(([model]) => newOutput(model, outputMode))
  }

  newRound.outputs.forEach(async (output, i) => {
    const isImage = output.outputMode === 'image'
    let res

    try {
      res = await llmGen({
        model: models[output.model].modelString,
        thinking: models[output.model].thinking,
        thinkingCapable: models[output.model].thinkingCapable,
        systemInstruction: newRound.systemInstruction,
        prompt: newRound.prompt,
        imageOutput: isImage,
        promptImage: newRound.promptImage
      })
    } catch (e) {
      console.error(e)
      set(state => {
        const round = state.feed.find(round => round.id === newRound.id)
        if (!round) {
          return
        }
        round.outputs[i] = {
          ...output,
          isBusy: false,
          gotError: true,
          totalTime: Date.now() - output.startTime
        }
      })
      return
    }

    set(state => {
      const output = newRound.outputs[i]
      const round = state.feed.find(round => round.id === newRound.id)

      if (!round) {
        return
      }

      const outputData = isImage
        ? res
        : res
            .replace(/```\w+/gm, '')
            .replace(/```\n?$/gm, '')
            .trim()

      round.outputs[i] = {
        ...output,
        outputData,
        isBusy: false,
        totalTime: Date.now() - output.startTime
      }
    })
  })

  set(state => {
    state.feed.unshift(newRound)
  })
}

export const setOutputMode = mode =>
  set(state => {
    state.outputMode = mode
    const isImageMode = mode === 'image'

    // Image mode is only supported in Batch mode. Switch if necessary.
    if (isImageMode && !state.batchMode) {
      state.batchMode = true
    }

    // When changing modes, ensure the selected models are compatible.
    const {batchMode, batchModel, versusModels} = state

    if (batchMode) {
      const currentBatchModelIsCompatible = isImageMode
        ? models[batchModel].imageOutput
        : !models[batchModel].imageOutput

      if (!currentBatchModelIsCompatible) {
        const newModel = Object.keys(models).find(key =>
          isImageMode
            ? models[key].imageOutput
            : !models[key].imageOutput
        )
        if (newModel) {
          state.batchModel = newModel
        }
      }
    } else {
      // Versus mode. Deselect any incompatible models.
      let anyModelSelected = false
      Object.keys(versusModels).forEach(modelKey => {
        const model = models[modelKey]
        const modelIsCompatible = isImageMode
          ? model.imageOutput
          : !model.imageOutput

        if (!modelIsCompatible) {
          state.versusModels[modelKey] = false
        }
        // Check selection status *after* potentially deselecting it.
        if (state.versusModels[modelKey]) {
          anyModelSelected = true
        }
      })

      // If no models are selected after filtering, select a compatible default.
      if (!anyModelSelected) {
        // Since we are in Versus mode, we are looking for a non-image model.
        const firstCompatibleModel = Object.keys(models).find(
          key => !models[key].imageOutput
        )
        if (
          firstCompatibleModel &&
          state.versusModels.hasOwnProperty(firstCompatibleModel)
        ) {
          state.versusModels[firstCompatibleModel] = true
        }
      }
    }
  })

export const setBatchModel = model =>
  set(state => {
    state.batchModel = model
  })

export const setBatchMode = active =>
  set(state => {
    state.batchMode = active

    if (!active && state.outputMode === 'image') {
      state.outputMode = Object.keys(modes)[0]
    }
  })

export const setBatchSize = size =>
  set(state => {
    state.batchSize = size
  })

export const setVersusModel = (model, active) =>
  set(state => {
    state.versusModels[model] = active
  })

export const setVersusModels = newModels =>
  set(state => {
    Object.keys(state.versusModels).forEach(key => {
      state.versusModels[key] = false
    })
    newModels.forEach(model => {
      if (state.versusModels.hasOwnProperty(model)) {
        state.versusModels[model] = true
      }
    })
  })

export const removeRound = id =>
  set(state => {
    state.feed = state.feed.filter(round => round.id !== id)
  })

export const reset = () => {
  set(state => {
    state.feed = []
  })
}

export const clearPromptHistory = () =>
  set(state => {
    state.promptHistory = []
  })

init()
