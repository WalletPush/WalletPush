import { JSDOM } from 'jsdom'
import { renderToString } from 'react-dom/server'
import React from 'react'

export function composeFullPreview(opts: {
  defaultFullHtml: string
  htmlStatic: string
  contentModel: any
  renderers?: {
    header?: (model: any) => React.ReactElement
    pricing?: (model: any) => React.ReactElement
    footer?: (model: any) => React.ReactElement
  }
}) {
  const { defaultFullHtml, htmlStatic, contentModel, renderers } = opts

  const stub = new JSDOM(htmlStatic)
  const bodyDoc = stub.window.document

  const inject = (name: string, html: string) => {
    bodyDoc.querySelectorAll(`[data-wp-slot="${name}"]`).forEach(node => {
      const wrap = bodyDoc.createElement('div')
      wrap.innerHTML = html
      node.replaceWith(...Array.from(wrap.childNodes))
    })
  }

  if (renderers?.header) inject('header', renderToString(renderers.header(contentModel.header || {})))
  if (renderers?.pricing) inject('pricing', renderToString(renderers.pricing(contentModel.pricing || {})))
  if (renderers?.footer) inject('footer', renderToString(renderers.footer(contentModel.footer || {})))

  const composedBodyHtml = bodyDoc.body.innerHTML

  const dom = new JSDOM(defaultFullHtml)
  const doc = dom.window.document
  doc.body.innerHTML = composedBodyHtml
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
}


