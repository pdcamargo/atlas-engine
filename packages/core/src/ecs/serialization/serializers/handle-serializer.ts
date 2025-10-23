import {
  AssetId,
  createHandle,
  createWeakHandle,
  isWeakHandle,
  type Handle,
  type WeakHandle,
} from "../../assets/handle";
import type {
  CustomSerializer,
  DeserializationContext,
  SerializationContext,
  SerializedHandle,
  SerializedWeakHandle,
} from "../types";
import { SerializationMarkers } from "../types";

/**
 * Serializer for Handle<T> and WeakHandle<T>
 * Converts handles to/from their AssetId string representation
 */
export class HandleSerializer implements CustomSerializer {
  name = "handle";

  canSerialize(value: any): boolean {
    return (
      value &&
      typeof value === "object" &&
      "id" in value &&
      value.id instanceof AssetId &&
      "__brand" in value
    );
  }

  serialize(
    value: Handle<any> | WeakHandle<any>,
    context: SerializationContext
  ): SerializedHandle | SerializedWeakHandle {
    const assetId = value.id.toString();
    const isWeak = isWeakHandle(value);

    if (isWeak) {
      return {
        [SerializationMarkers.WEAK_HANDLE]: true,
        [SerializationMarkers.ASSET_ID]: assetId,
      };
    }

    return {
      [SerializationMarkers.HANDLE]: true,
      [SerializationMarkers.ASSET_ID]: assetId,
    };
  }

  deserialize(
    data: SerializedHandle | SerializedWeakHandle,
    context: DeserializationContext
  ): Handle<any> | WeakHandle<any> {
    const assetIdString = data[SerializationMarkers.ASSET_ID];
    const assetId = AssetId.fromString(assetIdString);

    if (
      SerializationMarkers.WEAK_HANDLE in data &&
      data[SerializationMarkers.WEAK_HANDLE]
    ) {
      return createWeakHandle(assetId);
    }

    return createHandle(assetId);
  }
}
