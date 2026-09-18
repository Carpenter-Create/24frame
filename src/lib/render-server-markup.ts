import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const SUSPENSE_TYPE = Symbol.for("react.suspense");
const FRAGMENT_TYPE = Symbol.for("react.fragment");

// Test helper: resolve async Server Components and skip Suspense fallbacks
// so streamed Social slots can be asserted as the painted tree.

export async function renderServerMarkup(node: ReactNode): Promise<string> {
  const resolved = await unwrapServerNode(node);
  if (resolved == null || typeof resolved === "boolean") return "";
  if (typeof resolved === "string" || typeof resolved === "number" || typeof resolved === "bigint") {
    return String(resolved);
  }
  return renderToStaticMarkup(resolved as ReactElement);
}

async function unwrapServerNode(node: ReactNode): Promise<ReactNode> {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") {
    return node;
  }
  if (typeof node === "bigint") return node;
  if (isThenable(node)) {
    return unwrapServerNode(await node);
  }
  if (Array.isArray(node)) {
    return Promise.all(node.map((child) => unwrapServerNode(child)));
  }
  if (!isValidElement(node)) return node;

  const type = node.type as unknown;
  if (type === SUSPENSE_TYPE || type === FRAGMENT_TYPE) {
    return unwrapServerNode((node.props as { children?: ReactNode }).children);
  }
  if (typeof type === "function") {
    if (type.prototype?.isReactComponent) {
      return cloneWithChildren(node);
    }
    if (isAsyncFunction(type)) {
      return unwrapServerNode(await (type as (props: object) => Promise<ReactNode>)(node.props as object));
    }
    return cloneWithChildren(node);
  }
  return cloneWithChildren(node);
}

async function cloneWithChildren(node: ReactElement): Promise<ReactElement> {
  const props = node.props as { children?: ReactNode };
  if (!("children" in props) || props.children === undefined) return node;
  return {
    ...node,
    props: { ...props, children: await unwrapServerNode(props.children) },
  };
}

function isThenable(value: unknown): value is Promise<ReactNode> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as Promise<unknown>).then === "function" &&
    !isValidElement(value)
  );
}

function isAsyncFunction(fn: unknown): boolean {
  return typeof fn === "function" && fn.constructor?.name === "AsyncFunction";
}
