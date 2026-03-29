// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentRegistry {
    struct DocumentData {
        string hash;
        string uploaderId;
        uint256 timestamp;
        uint256 version;
    }

    struct AccessLog {
        string userId;
        string actionType;
        uint256 timestamp;
    }

    struct SignatureData {
        string signerId;
        string signatureHash;
        string role;
        uint256 timestamp;
    }

    // Mapping from documentId to list of versions
    mapping(string => DocumentData[]) public documentVersions;
    mapping(string => AccessLog[]) public accessLogs;
    mapping(string => SignatureData[]) public documentSignatures;

    address public owner;

    event DocumentRegistered(string indexed documentId, string hash, string uploaderId, uint256 version, uint256 timestamp);
    event DocumentUpdated(string indexed documentId, string hash, string uploaderId, uint256 version, uint256 timestamp);
    event AccessLogged(string indexed documentId, string userId, string actionType, uint256 timestamp);
    event DocumentSigned(string indexed documentId, string signerId, string signatureHash, string role, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    function registerDocument(string memory _documentId, string memory _hash, string memory _uploaderId) public onlyOwner {
        require(documentVersions[_documentId].length == 0, "Document already exists");

        DocumentData memory newDoc = DocumentData({
            hash: _hash,
            uploaderId: _uploaderId,
            timestamp: block.timestamp,
            version: 1
        });

        documentVersions[_documentId].push(newDoc);
        emit DocumentRegistered(_documentId, _hash, _uploaderId, 1, block.timestamp);
    }

    function updateDocumentVersion(string memory _documentId, string memory _newHash, string memory _uploaderId) public onlyOwner {
        require(documentVersions[_documentId].length > 0, "Document does not exist");

        uint256 newVersion = documentVersions[_documentId].length + 1;

        DocumentData memory newDocVersion = DocumentData({
            hash: _newHash,
            uploaderId: _uploaderId,
            timestamp: block.timestamp,
            version: newVersion
        });

        documentVersions[_documentId].push(newDocVersion);
        emit DocumentUpdated(_documentId, _newHash, _uploaderId, newVersion, block.timestamp);
    }

    function getDocumentHash(string memory _documentId) public view returns (string memory) {
        require(documentVersions[_documentId].length > 0, "Document does not exist");
        uint256 latestIndex = documentVersions[_documentId].length - 1;
        return documentVersions[_documentId][latestIndex].hash;
    }

    function getDocumentHistory(string memory _documentId) public view returns (DocumentData[] memory) {
        return documentVersions[_documentId];
    }

    function verifyDocument(string memory _documentId, string memory _hash) public view returns (bool, uint256) {
        DocumentData[] memory history = documentVersions[_documentId];
        for (uint256 i = 0; i < history.length; i++) {
            if (keccak256(abi.encodePacked(history[i].hash)) == keccak256(abi.encodePacked(_hash))) {
                return (true, history[i].version);
            }
        }
        return (false, 0);
    }

    function logAccess(string memory _documentId, string memory _userId, string memory _actionType) public onlyOwner {
        AccessLog memory newLog = AccessLog({
            userId: _userId,
            actionType: _actionType,
            timestamp: block.timestamp
        });
        accessLogs[_documentId].push(newLog);
        emit AccessLogged(_documentId, _userId, _actionType, block.timestamp);
    }

    function getAccessLogs(string memory _documentId) public view returns (AccessLog[] memory) {
        return accessLogs[_documentId];
    }

    function signDocument(string memory _documentId, string memory _signerId, string memory _signatureHash, string memory _role) public onlyOwner {
        SignatureData memory newSig = SignatureData({
            signerId: _signerId,
            signatureHash: _signatureHash,
            role: _role,
            timestamp: block.timestamp
        });
        documentSignatures[_documentId].push(newSig);
        emit DocumentSigned(_documentId, _signerId, _signatureHash, _role, block.timestamp);
    }

    function getSignatures(string memory _documentId) public view returns (SignatureData[] memory) {
        return documentSignatures[_documentId];
    }
}
