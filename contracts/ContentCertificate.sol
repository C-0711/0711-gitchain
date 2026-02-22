// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title ContentCertificate
 * @dev 0711 Content Chain - Blockchain-verified AI content certification
 * @notice Stores Merkle roots for batched content certifications
 * Network: Base (Ethereum L2)
 */
contract ContentCertificate is Ownable {
    
    // ============================================
    // STRUCTS
    // ============================================
    
    struct BatchCertification {
        bytes32 merkleRoot;      // Root of Merkle tree containing content hashes
        uint256 timestamp;       // Block timestamp when certified
        string metadataURI;      // IPFS CID containing full manifests
        uint256 itemCount;       // Number of items in batch
        uint8 schemaVersion;     // Schema version for future compatibility
        address issuer;          // Address that submitted the batch
    }
    
    // ============================================
    // STATE
    // ============================================
    
    mapping(uint256 => BatchCertification) public certifications;
    uint256 public nextBatchId;
    
    // Compliance rule versions (for audit trail)
    mapping(string => uint256) public ruleVersions;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event BatchCertified(
        uint256 indexed batchId,
        bytes32 merkleRoot,
        uint256 itemCount,
        string metadataURI,
        address indexed issuer
    );
    
    event RuleUpdated(string ruleId, uint256 version);
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() Ownable(msg.sender) {
        // Initialize rule versions
        ruleVersions["ecgt_no_greenwashing"] = 1;
        ruleVersions["ai_act_art50_provenance"] = 1;
        ruleVersions["dsgvo_no_pii"] = 1;
    }
    
    // ============================================
    // CERTIFICATION FUNCTIONS
    // ============================================
    
    /**
     * @notice Certify a batch of content items
     * @param _merkleRoot Merkle root of all content manifest hashes
     * @param _metadataURI IPFS CID containing full manifests (JSON)
     * @param _itemCount Number of items in this batch
     * @param _schemaVersion Schema version (for future compatibility)
     * @return batchId The ID of the created batch
     */
    function certifyBatch(
        bytes32 _merkleRoot,
        string calldata _metadataURI,
        uint256 _itemCount,
        uint8 _schemaVersion
    ) external onlyOwner returns (uint256) {
        uint256 batchId = nextBatchId++;
        
        certifications[batchId] = BatchCertification({
            merkleRoot: _merkleRoot,
            timestamp: block.timestamp,
            metadataURI: _metadataURI,
            itemCount: _itemCount,
            schemaVersion: _schemaVersion,
            issuer: msg.sender
        });
        
        emit BatchCertified(batchId, _merkleRoot, _itemCount, _metadataURI, msg.sender);
        
        return batchId;
    }
    
    /**
     * @notice Verify a content item is part of a certified batch
     * @param _batchId The batch to verify against
     * @param _contentManifestHash Hash of the content manifest
     * @param _merkleProof Merkle proof for the content
     * @return verified True if the content is certified
     */
    function verifyCertification(
        uint256 _batchId,
        bytes32 _contentManifestHash,
        bytes32[] calldata _merkleProof
    ) external view returns (bool verified) {
        BatchCertification storage batch = certifications[_batchId];
        require(batch.merkleRoot != bytes32(0), "Batch does not exist");
        
        return MerkleProof.verify(_merkleProof, batch.merkleRoot, _contentManifestHash);
    }
    
    /**
     * @notice Get certification details for a batch
     * @param _batchId The batch ID
     * @return merkleRoot The Merkle root
     * @return timestamp When certified
     * @return metadataURI IPFS CID
     * @return itemCount Number of items
     * @return issuer Who certified
     */
    function getCertification(uint256 _batchId) external view returns (
        bytes32 merkleRoot,
        uint256 timestamp,
        string memory metadataURI,
        uint256 itemCount,
        address issuer
    ) {
        BatchCertification storage batch = certifications[_batchId];
        return (
            batch.merkleRoot,
            batch.timestamp,
            batch.metadataURI,
            batch.itemCount,
            batch.issuer
        );
    }
    
    // ============================================
    // RULE MANAGEMENT
    // ============================================
    
    /**
     * @notice Update a compliance rule version (for audit trail)
     * @param _ruleId Rule identifier (e.g., "ecgt_no_greenwashing")
     * @param _version New version number
     */
    function updateRule(string calldata _ruleId, uint256 _version) external onlyOwner {
        ruleVersions[_ruleId] = _version;
        emit RuleUpdated(_ruleId, _version);
    }
    
    /**
     * @notice Get current rule version
     * @param _ruleId Rule identifier
     * @return version Current version
     */
    function getRuleVersion(string calldata _ruleId) external view returns (uint256) {
        return ruleVersions[_ruleId];
    }
}
