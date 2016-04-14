'use strict';
const assert  = require('assert');
const Project = require('../lib/project');
const moment  = require('moment');

describe('Project', () => {

  var assertDurationEqual = function(actual, expected) {
    assert.equal(actual.asMinutes(), expected.asMinutes());
  };

  var relativeProject;
  var absoluteProject;
  beforeEach(() => {
    relativeProject = new Project({
      name: 'project1',
      totalDuration: moment.duration(10, 'h'),
      durationStr: '10%'
    });

    absoluteProject = new Project({
      name: 'project2',
      totalDuration: moment.duration(10, 'h'),
      durationStr: '1:00'
    });
  });

  describe('constructor', () => {
    it('should create a project that has relative duration with percent string', () => {
      let project = relativeProject;
      assert.equal(project.name                    , 'project1');
      assert.equal(project.totalDuration.humanize(), '10 hours');
      assert.equal(project.type                    , Project.DurationType.Relative);
    });

    it('should create a project that has absolute duration with date string', () => {
      let project = absoluteProject;
      assert.equal(project.name                    , 'project2');
      assert.equal(project.totalDuration.humanize(), '10 hours');
      assert.equal(project.type                    , Project.DurationType.Absolute);
    });
  });

  describe('getDuration', () => {
    it('should return relative duration', () => {
      assertDurationEqual(relativeProject.getDuration(), moment.duration(1, 'h'));
    });

    it('should return absolute duration', () => {
      assertDurationEqual(absoluteProject.getDuration(), moment.duration(1, 'h'));
    });
  });

  describe('isRelative', () => {
    it('should return if its duration type is relative or not', () => {
      assert(relativeProject.isRelative());
      assert(!absoluteProject.isRelative());
    });
  });

  describe('isAbsolute', () => {
    it('should return if its duration type is absolute or not', () => {
      assert(!relativeProject.isAbsolute());
      assert(absoluteProject.isAbsolute());
    });
  });

  describe('setExtraDuration', () => {
    it('should add extra duration', () => {
      relativeProject.setExtraDuration(moment.duration(2, 'h'));
      absoluteProject.setExtraDuration(moment.duration(2, 'h'));
      assert.equal(relativeProject.getDuration().humanize(), '3 hours');
      assert.equal(absoluteProject.getDuration().humanize(), '3 hours');
    });
  });

  describe('toDurationString', () => {
    it('should return string of duration', () => {
      assert.equal(relativeProject.toDurationString(), '1:00');
      assert.equal(absoluteProject.toDurationString(), '1:00');
    });
  });

  describe('toJSON', () => {
    it('should return plain object for json', () => {
      assert.deepEqual(relativeProject.toJSON(), { name: 'project1', duration: '1:00' });
      assert.deepEqual(absoluteProject.toJSON(), { name: 'project2', duration: '1:00' });
    });
  });

  describe('Project.calculateProjects', () => {
    it('should calcuate project durations', () => {
      let t        = moment.duration(10, 'h');
      let projects = [
        new Project({ name: '1', durationStr: '100%', totalDuration: t}),
        new Project({ name: '2', durationStr: '2:00', totalDuration: t}),
        new Project({ name: '3', durationStr: '1:00', totalDuration: t}),
      ];

      Project.calculateProjects(projects, t);
      assertDurationEqual(projects[0].getDuration(), moment.duration(7, 'h'));
      assertDurationEqual(projects[1].getDuration(), moment.duration(2, 'h'));
      assertDurationEqual(projects[2].getDuration(), moment.duration(1, 'h'));
    });

    it('should calcuate project durations that are all relative', () => {
      let t        = moment.duration(10, 'h');
      let projects = [
        new Project({ name: '1', durationStr: '60%', totalDuration: t}),
        new Project({ name: '2', durationStr: '35%', totalDuration: t}),
        new Project({ name: '3', durationStr: '5%', totalDuration: t}),
      ];

      Project.calculateProjects(projects, t);
      assertDurationEqual(projects[0].getDuration(), moment.duration(6, 'h'));
      assertDurationEqual(projects[1].getDuration(), moment.duration(3.5, 'h'));
      assertDurationEqual(projects[2].getDuration(), moment.duration(0.5, 'h'));
    });

    it('should calcuate project durations that are relative and absolute ', () => {
      let t        = moment.duration(10, 'h');
      let projects = [
        new Project({ name: '1', durationStr: '50%', totalDuration: t}),
        new Project({ name: '2', durationStr: '5:00', totalDuration: t}),
        new Project({ name: '3', durationStr: '50%', totalDuration: t}),
      ];

      Project.calculateProjects(projects, t);
      assertDurationEqual(projects[0].getDuration(), moment.duration(2.5, 'h'));
      assertDurationEqual(projects[1].getDuration(), moment.duration(5, 'h'));
      assertDurationEqual(projects[2].getDuration(), moment.duration(2.5, 'h'));
    });


    it('should calcuate project durations that has extra duration', () => {
      let t        = moment.duration(10, 'h');
      let projects = [
        new Project({ name: '1', durationStr: '1:00', totalDuration: t}),
        new Project({ name: '2', durationStr: '2:00', totalDuration: t}),
        new Project({ name: '3', durationStr: '3:00', totalDuration: t}),
      ];

      Project.calculateProjects(projects, t);
      assertDurationEqual(projects[0].getDuration(), moment.duration(1, 'h'));
      assertDurationEqual(projects[1].getDuration(), moment.duration(2, 'h'));
      assertDurationEqual(projects[2].getDuration(), moment.duration(7, 'h'));
    });
  });
});
