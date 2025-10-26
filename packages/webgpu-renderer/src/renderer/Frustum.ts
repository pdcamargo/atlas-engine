import { Mat4, Vector3 } from "@atlas/core";

/**
 * Represents a view frustum for culling calculations
 * Extracts 6 planes from a view-projection matrix
 */
export class Frustum {
  // Frustum planes: [left, right, bottom, top, near, far]
  // Each plane is represented as [a, b, c, d] where ax + by + cz + d = 0
  private planes: Float32Array = new Float32Array(24); // 6 planes * 4 components

  /**
   * Extract frustum planes from a view-projection matrix
   */
  public setFromMatrix(vpMatrix: Mat4): void {
    const m = vpMatrix.data;

    // Left plane: m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]
    this.planes[0] = m[3] + m[0];
    this.planes[1] = m[7] + m[4];
    this.planes[2] = m[11] + m[8];
    this.planes[3] = m[15] + m[12];
    this.normalizePlane(0);

    // Right plane: m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]
    this.planes[4] = m[3] - m[0];
    this.planes[5] = m[7] - m[4];
    this.planes[6] = m[11] - m[8];
    this.planes[7] = m[15] - m[12];
    this.normalizePlane(4);

    // Bottom plane: m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]
    this.planes[8] = m[3] + m[1];
    this.planes[9] = m[7] + m[5];
    this.planes[10] = m[11] + m[9];
    this.planes[11] = m[15] + m[13];
    this.normalizePlane(8);

    // Top plane: m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]
    this.planes[12] = m[3] - m[1];
    this.planes[13] = m[7] - m[5];
    this.planes[14] = m[11] - m[9];
    this.planes[15] = m[15] - m[13];
    this.normalizePlane(12);

    // Near plane: m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]
    this.planes[16] = m[3] + m[2];
    this.planes[17] = m[7] + m[6];
    this.planes[18] = m[11] + m[10];
    this.planes[19] = m[15] + m[14];
    this.normalizePlane(16);

    // Far plane: m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]
    this.planes[20] = m[3] - m[2];
    this.planes[21] = m[7] - m[6];
    this.planes[22] = m[11] - m[10];
    this.planes[23] = m[15] - m[14];
    this.normalizePlane(20);
  }

  /**
   * Normalize a plane equation
   */
  private normalizePlane(offset: number): void {
    const length = Math.sqrt(
      this.planes[offset] * this.planes[offset] +
        this.planes[offset + 1] * this.planes[offset + 1] +
        this.planes[offset + 2] * this.planes[offset + 2]
    );

    if (length > 0) {
      this.planes[offset] /= length;
      this.planes[offset + 1] /= length;
      this.planes[offset + 2] /= length;
      this.planes[offset + 3] /= length;
    }
  }

  /**
   * Calculate signed distance from a point to a plane
   */
  private distanceToPlane(planeOffset: number, x: number, y: number, z: number): number {
    return (
      this.planes[planeOffset] * x +
      this.planes[planeOffset + 1] * y +
      this.planes[planeOffset + 2] * z +
      this.planes[planeOffset + 3]
    );
  }

  /**
   * Check if a point is inside the frustum
   */
  public containsPoint(point: Vector3): boolean {
    const x = point.x;
    const y = point.y;
    const z = point.z;

    // Check all 6 planes
    for (let i = 0; i < 6; i++) {
      const offset = i * 4;
      if (this.distanceToPlane(offset, x, y, z) < 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a sphere is inside or intersects the frustum
   * @param center Center of the sphere
   * @param radius Radius of the sphere
   */
  public containsSphere(center: Vector3, radius: number): boolean {
    const x = center.x;
    const y = center.y;
    const z = center.z;

    // Check all 6 planes
    for (let i = 0; i < 6; i++) {
      const offset = i * 4;
      const distance = this.distanceToPlane(offset, x, y, z);

      // If the distance from the center to the plane is less than -radius,
      // the sphere is completely outside the frustum
      if (distance < -radius) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if an axis-aligned bounding box (AABB) is inside or intersects the frustum
   * @param min Minimum corner of the AABB
   * @param max Maximum corner of the AABB
   */
  public containsAABB(min: Vector3, max: Vector3): boolean {
    // Check all 6 planes
    for (let i = 0; i < 6; i++) {
      const offset = i * 4;
      const nx = this.planes[offset];
      const ny = this.planes[offset + 1];
      const nz = this.planes[offset + 2];

      // Find the positive vertex (furthest point in the direction of the plane normal)
      const px = nx >= 0 ? max.x : min.x;
      const py = ny >= 0 ? max.y : min.y;
      const pz = nz >= 0 ? max.z : min.z;

      // If the positive vertex is outside this plane, the AABB is completely outside
      if (this.distanceToPlane(offset, px, py, pz) < 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if an AABB (defined by center and half-extents) is inside or intersects the frustum
   * This is optimized for sprites with center position and size
   */
  public containsAABBCenterSize(
    centerX: number,
    centerY: number,
    centerZ: number,
    halfWidth: number,
    halfHeight: number,
    halfDepth: number = 0
  ): boolean {
    // Check all 6 planes
    for (let i = 0; i < 6; i++) {
      const offset = i * 4;
      const nx = this.planes[offset];
      const ny = this.planes[offset + 1];
      const nz = this.planes[offset + 2];

      // Find the positive vertex (furthest point in the direction of the plane normal)
      const px = centerX + (nx >= 0 ? halfWidth : -halfWidth);
      const py = centerY + (ny >= 0 ? halfHeight : -halfHeight);
      const pz = centerZ + (nz >= 0 ? halfDepth : -halfDepth);

      // If the positive vertex is outside this plane, the AABB is completely outside
      if (this.distanceToPlane(offset, px, py, pz) < 0) {
        return false;
      }
    }

    return true;
  }
}
